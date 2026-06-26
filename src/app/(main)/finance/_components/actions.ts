"use server";

import { revalidatePath } from "next/cache";

import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

type CostType =
  | "china_domestic"
  | "import_tax"
  | "vat"
  | "vietnam_domestic"
  | "three_wheel_fee"
  | "customs_fee"
  | "sea_freight"
  | "other_cost";

type ChargeType =
  | "customer_freight"
  | "china_domestic_charge"
  | "import_tax_charge"
  | "vat_charge"
  | "surcharge"
  | "customs_fee_charge"
  | "sea_freight_charge"
  | "other_revenue"
  | "revenue_discount";

interface IdRow extends RowDataPacket {
  id: string;
}

interface TotalsRow extends RowDataPacket {
  total_cost_vnd: number | string | null;
  total_business_cost_vnd: number | string | null;
  total_charge_vnd: number | string | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  return trimmed.length ? trimmed : null;
}

function money(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return 0;

  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

async function makeUuid(conn: PoolConnection) {
  const [rows] = await conn.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

async function upsertCost(conn: PoolConnection, orderId: string, costType: CostType, amountVnd: number) {
  const [existing] = await conn.query<IdRow[]>(
    "select cost_id as id from order_costs where order_id = ? and cost_type = ? order by created_at asc limit 1",
    [orderId, costType],
  );
  const costId = existing[0]?.id;

  if (costId) {
    await conn.query(
      `
        update order_costs
        set amount_original = ?, amount_vnd = ?, currency_code = 'VND', exchange_rate = 1,
            is_business_cost = 1, updated_at = current_timestamp
        where cost_id = ?
      `,
      [amountVnd, amountVnd, costId],
    );

    return;
  }

  if (amountVnd === 0) return;

  await conn.query(
    `
      insert into order_costs (
        cost_id, order_id, cost_type, currency_code, amount_original, exchange_rate,
        amount_vnd, is_business_cost, paid_status, cost_date
      ) values (?, ?, ?, 'VND', ?, 1, ?, 1, 'unpaid', curdate())
    `,
    [await makeUuid(conn), orderId, costType, amountVnd, amountVnd],
  );
}

async function upsertCharge(conn: PoolConnection, orderId: string, chargeType: ChargeType, amountVnd: number) {
  const [existing] = await conn.query<IdRow[]>(
    "select charge_id as id from order_charges where order_id = ? and charge_type = ? order by created_at asc limit 1",
    [orderId, chargeType],
  );
  const chargeId = existing[0]?.id;

  if (chargeId) {
    await conn.query(
      `
        update order_charges
        set amount_original = ?, amount_vnd = ?, currency_code = 'VND', exchange_rate = 1,
            updated_at = current_timestamp
        where charge_id = ?
      `,
      [amountVnd, amountVnd, chargeId],
    );

    return;
  }

  if (amountVnd === 0) return;

  await conn.query(
    `
      insert into order_charges (
        charge_id, order_id, charge_type, currency_code, amount_original,
        exchange_rate, amount_vnd, charge_date
      ) values (?, ?, ?, 'VND', ?, 1, ?, curdate())
    `,
    [await makeUuid(conn), orderId, chargeType, amountVnd, amountVnd],
  );
}

async function recalculateOrder(
  conn: PoolConnection,
  orderId: string,
  paidAmountVnd: number,
  statusOverride?: string | null,
) {
  const [rows] = await conn.query<TotalsRow[]>(
    `
      select
        coalesce((select sum(amount_vnd) from order_costs where order_id = ?), 0) as total_cost_vnd,
        coalesce((select sum(amount_vnd) from order_costs where order_id = ? and is_business_cost = 1), 0) as total_business_cost_vnd,
        coalesce((select sum(amount_vnd) from order_charges where order_id = ?), 0) as total_charge_vnd
    `,
    [orderId, orderId, orderId],
  );
  const totals = rows[0];
  const totalCostVnd = toNumber(totals?.total_cost_vnd);
  const totalBusinessCostVnd = toNumber(totals?.total_business_cost_vnd);
  const totalChargeVnd = toNumber(totals?.total_charge_vnd);
  const remainingAmountVnd = Math.max(totalChargeVnd - paidAmountVnd, 0);
  const autoCollectionStatus =
    remainingAmountVnd <= 0 && totalChargeVnd > 0 ? "collected" : paidAmountVnd > 0 ? "partial" : "not_collected";
  const collectionStatus = statusOverride ?? autoCollectionStatus;

  await conn.query(
    `
      update orders
      set
        total_cost_vnd = ?,
        total_business_cost_vnd = ?,
        total_charge_vnd = ?,
        paid_amount_vnd = ?,
        remaining_amount_vnd = ?,
        gross_profit_vnd = ?,
        business_profit_vnd = ?,
        collection_status = ?,
        updated_at = current_timestamp
      where order_id = ?
    `,
    [
      totalCostVnd,
      totalBusinessCostVnd,
      totalChargeVnd,
      paidAmountVnd,
      remainingAmountVnd,
      totalChargeVnd - totalCostVnd,
      totalChargeVnd - totalBusinessCostVnd,
      collectionStatus,
      orderId,
    ],
  );

  const [receivables] = await conn.query<CountRow[]>("select count(*) as total from receivables where order_id = ?", [
    orderId,
  ]);

  if (toNumber(receivables[0]?.total) > 0) {
    await conn.query(
      `
        update receivables r
        join orders o on o.order_id = r.order_id
        set
          r.total_amount_vnd = ?,
          r.paid_amount_vnd = ?,
          r.remaining_amount_vnd = ?,
          r.due_date = o.payment_due_date,
          r.status = ?,
          r.overdue_days = greatest(datediff(curdate(), o.payment_due_date), 0),
          r.updated_at = current_timestamp
        where r.order_id = ?
      `,
      [totalChargeVnd, paidAmountVnd, remainingAmountVnd, collectionStatus, orderId],
    );

    return;
  }

  await conn.query(
    `
      insert into receivables (
        receivable_id, order_id, customer_id, total_amount_vnd, paid_amount_vnd,
        remaining_amount_vnd, due_date, status, overdue_days
      )
      select uuid(), order_id, customer_id, ?, ?, ?, payment_due_date, ?,
        greatest(datediff(curdate(), payment_due_date), 0)
      from orders
      where order_id = ?
    `,
    [totalChargeVnd, paidAmountVnd, remainingAmountVnd, collectionStatus, orderId],
  );
}

export async function updateFinanceEntry(formData: FormData) {
  const orderId = text(formData, "orderId");
  if (!orderId) throw new Error("Thieu order_id de cap nhat tai chinh.");

  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await upsertCost(conn, orderId, "china_domestic", money(formData, "chinaDomesticCostVnd"));
    await upsertCost(conn, orderId, "import_tax", money(formData, "importTaxCostVnd"));
    await upsertCost(conn, orderId, "vat", money(formData, "vatCostVnd"));
    await upsertCost(conn, orderId, "vietnam_domestic", money(formData, "vietnamDomesticCostVnd"));
    await upsertCost(conn, orderId, "three_wheel_fee", money(formData, "threeWheelFeeVnd"));
    await upsertCost(conn, orderId, "customs_fee", money(formData, "customsCostVnd"));
    await upsertCost(conn, orderId, "sea_freight", money(formData, "seaFreightCostVnd"));
    await upsertCost(conn, orderId, "other_cost", money(formData, "otherCostVnd"));

    await upsertCharge(conn, orderId, "customer_freight", money(formData, "customerFreightVnd"));
    await upsertCharge(conn, orderId, "china_domestic_charge", money(formData, "chinaDomesticChargeVnd"));
    await upsertCharge(conn, orderId, "import_tax_charge", money(formData, "importTaxChargeVnd"));
    await upsertCharge(conn, orderId, "vat_charge", money(formData, "vatChargeVnd"));
    await upsertCharge(conn, orderId, "surcharge", money(formData, "surchargeVnd"));
    await upsertCharge(conn, orderId, "customs_fee_charge", money(formData, "customsChargeVnd"));
    await upsertCharge(conn, orderId, "sea_freight_charge", money(formData, "seaFreightChargeVnd"));
    await upsertCharge(conn, orderId, "other_revenue", money(formData, "otherRevenueVnd"));
    await upsertCharge(conn, orderId, "revenue_discount", -Math.abs(money(formData, "revenueDiscountVnd")));

    const requestedStatus = text(formData, "collectionStatus");
    const collectionStatus = ["not_collected", "partial", "collected", "overdue", "bad_debt"].includes(
      requestedStatus ?? "",
    )
      ? requestedStatus
      : null;

    await recalculateOrder(conn, orderId, money(formData, "paidAmountVnd"), collectionStatus);

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  revalidatePath("/finance");
  revalidatePath("/dashboard/finance");
}
