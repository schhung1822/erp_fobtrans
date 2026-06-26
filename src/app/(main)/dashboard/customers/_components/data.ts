import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import type { CustomerRow, CustomersSummary } from "./schema";

interface CustomerQueryRow extends RowDataPacket {
  customer_id: string;
  customer_code: string | null;
  customer_name: string | null;
  phone: string | null;
  tax_code: string | null;
  delivery_address: string | null;
  billing_address: string | null;
  note: string | null;
  order_count: number | string | null;
  total_revenue_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
  last_order_date: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface SummaryQueryRow extends RowDataPacket {
  total_customers: number | string | null;
  customers_with_orders: number | string | null;
  total_revenue_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
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

  return date.toISOString();
}

export async function ensureCustomerExtraColumns() {
  const columns = [
    ["tax_code", "varchar(50) null after phone"],
    ["note", "text null after billing_address"],
  ] as const;
  const pool = getDbPool();

  for (const [name, definition] of columns) {
    const [rows] = await pool.query<CountQueryRow[]>(
      "select count(*) as total from information_schema.columns where table_schema = database() and table_name = 'customers' and column_name = ?",
      [name],
    );

    if (toNumber(rows[0]?.total) === 0) {
      await pool.query(`alter table customers add column ${name} ${definition}`);
    }
  }
}

export async function getCustomersData(): Promise<{ customers: CustomerRow[]; summary: CustomersSummary }> {
  await ensureCustomerExtraColumns();

  const pool = getDbPool();
  const [customerRows, summaryRows] = await Promise.all([
    pool.query<CustomerQueryRow[]>(
      `
        select
          c.customer_id,
          c.customer_code,
          c.customer_name,
          c.phone,
          c.tax_code,
          c.delivery_address,
          c.billing_address,
          c.note,
          c.created_at,
          c.updated_at,
          count(o.order_id) as order_count,
          coalesce(sum(o.total_charge_vnd), 0) as total_revenue_vnd,
          coalesce(sum(o.remaining_amount_vnd), 0) as total_receivable_vnd,
          max(coalesce(o.delivery_date, o.order_date, date(o.created_at))) as last_order_date
        from customers c
        left join orders o on o.customer_id = c.customer_id
        group by
          c.customer_id,
          c.customer_code,
          c.customer_name,
          c.phone,
          c.tax_code,
          c.delivery_address,
          c.billing_address,
          c.note,
          c.created_at,
          c.updated_at
        order by coalesce(max(o.created_at), c.updated_at, c.created_at) desc
        limit 500
      `,
    ),
    pool.query<SummaryQueryRow[]>(
      `
        select
          count(*) as total_customers,
          sum(case when stats.order_count > 0 then 1 else 0 end) as customers_with_orders,
          coalesce(sum(stats.total_revenue_vnd), 0) as total_revenue_vnd,
          coalesce(sum(stats.total_receivable_vnd), 0) as total_receivable_vnd
        from customers c
        left join (
          select
            customer_id,
            count(*) as order_count,
            coalesce(sum(total_charge_vnd), 0) as total_revenue_vnd,
            coalesce(sum(remaining_amount_vnd), 0) as total_receivable_vnd
          from orders
          group by customer_id
        ) stats on stats.customer_id = c.customer_id
      `,
    ),
  ]);

  const summaryRow = summaryRows[0][0];

  return {
    customers: customerRows[0].map((row) => ({
      id: row.customer_id,
      code: row.customer_code,
      name: row.customer_name ?? "Chua co ten khach hang",
      phone: row.phone,
      taxCode: row.tax_code,
      deliveryAddress: row.delivery_address,
      billingAddress: row.billing_address,
      note: row.note,
      orderCount: toNumber(row.order_count),
      totalRevenueVnd: toNumber(row.total_revenue_vnd),
      totalReceivableVnd: toNumber(row.total_receivable_vnd),
      lastOrderDate: toDateString(row.last_order_date),
      createdAt: toDateString(row.created_at),
      updatedAt: toDateString(row.updated_at),
    })),
    summary: {
      totalCustomers: toNumber(summaryRow?.total_customers),
      customersWithOrders: toNumber(summaryRow?.customers_with_orders),
      totalRevenueVnd: toNumber(summaryRow?.total_revenue_vnd),
      totalReceivableVnd: toNumber(summaryRow?.total_receivable_vnd),
    },
  };
}
