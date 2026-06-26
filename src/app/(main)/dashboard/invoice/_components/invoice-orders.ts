import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export interface InvoiceOrderOption {
  id: string;
  code: string;
  customerName: string;
  customerCode: string | null;
  customerEmail: string;
  customerTaxId: string;
  addressLines: string[];
  cargoName: string | null;
  totalPackages: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalChargeVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  orderDate: string | null;
  deliveryDate: string | null;
}

interface OrderOptionRow extends RowDataPacket {
  order_id: string;
  order_code: string;
  customer_code: string | null;
  customer_name: string | null;
  email: string | null;
  tax_code: string | null;
  billing_address: string | null;
  delivery_address: string | null;
  order_delivery_address: string | null;
  receiver_address: string | null;
  cargo_name: string | null;
  total_packages: number | string | null;
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  order_date: Date | string | null;
  delivery_date: Date | string | null;
}

interface CountQueryRow extends RowDataPacket {
  total: number | string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function toDateString(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

async function customerColumnExists(columnName: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<CountQueryRow[]>(
    "select count(*) as total from information_schema.columns where table_schema = database() and table_name = 'customers' and column_name = ?",
    [columnName],
  );

  return toNumber(rows[0]?.total) > 0;
}

export async function getInvoiceOrderOptions(): Promise<InvoiceOrderOption[]> {
  const hasEmail = await customerColumnExists("email");
  const hasTaxCode = await customerColumnExists("tax_code");
  const emailSelect = hasEmail ? "c.email" : "null";
  const taxCodeSelect = hasTaxCode ? "c.tax_code" : "null";

  const pool = getDbPool();
  const [rows] = await pool.query<OrderOptionRow[]>(
    `
      select
        o.order_id,
        o.order_code,
        c.customer_code,
        c.customer_name,
        ${emailSelect} as email,
        ${taxCodeSelect} as tax_code,
        c.billing_address,
        c.delivery_address,
        o.delivery_address as order_delivery_address,
        o.receiver_address,
        o.cargo_name,
        o.total_packages,
        o.total_weight_kg,
        o.total_volume_m3,
        o.total_charge_vnd,
        o.paid_amount_vnd,
        o.remaining_amount_vnd,
        o.order_date,
        o.delivery_date
      from orders o
      left join customers c on c.customer_id = o.customer_id
      order by coalesce(o.delivery_date, o.order_date, date(o.created_at)) desc, o.created_at desc
      limit 500
    `,
  );

  return rows.map((row) => {
    const address = row.billing_address ?? row.delivery_address ?? row.order_delivery_address ?? row.receiver_address;

    return {
      id: row.order_id,
      code: row.order_code,
      customerName: row.customer_name ?? "Chua co khach hang",
      customerCode: row.customer_code,
      customerEmail: row.email ?? "",
      customerTaxId: row.tax_code ?? "",
      addressLines: address ? address.split(/\r?\n/).filter(Boolean) : [],
      cargoName: row.cargo_name,
      totalPackages: toNumber(row.total_packages),
      totalWeightKg: toNumber(row.total_weight_kg),
      totalVolumeM3: toNumber(row.total_volume_m3),
      totalChargeVnd: toNumber(row.total_charge_vnd),
      paidAmountVnd: toNumber(row.paid_amount_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      orderDate: toDateString(row.order_date),
      deliveryDate: toDateString(row.delivery_date),
    };
  });
}
