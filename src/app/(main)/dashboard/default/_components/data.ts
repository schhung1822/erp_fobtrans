import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export interface DefaultDashboardSummary {
  newContacts: number;
  newCustomers: number;
  orders: number;
  revenueVnd: number;
}

export interface DefaultDashboardDay {
  date: string;
  contacts: number;
  orders: number;
  revenueVnd: number;
}

export interface StaffOrderReportRow {
  staffId: string;
  staffName: string;
  staffCode: string | null;
  leadCount: number;
  orderCount: number;
  conversionRate: number;
  revenueVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
}

export interface DashboardDateRange {
  from: string;
  to: string;
  fromMonth: string;
  toMonth: string;
}

export interface DefaultDashboardData {
  fromMonth: string;
  toMonth: string;
  summary: DefaultDashboardSummary;
  daily: DefaultDashboardDay[];
  staffReports: StaffOrderReportRow[];
}

interface SummaryRow extends RowDataPacket {
  new_contacts: number | string | null;
  new_customers: number | string | null;
  orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface ContactDailyRow extends RowDataPacket {
  day_key: string;
  contacts: number | string | null;
}

interface OrderDailyRow extends RowDataPacket {
  day_key: string;
  orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface StaffReportQueryRow extends RowDataPacket {
  staff_id: string | null;
  staff_code: string | null;
  staff_name: string | null;
  lead_count: number | string | null;
  order_count: number | string | null;
  revenue_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
}

interface LatestMonthRow extends RowDataPacket {
  latest_month: string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizedPhoneSql(columnName: string) {
  return `replace(replace(replace(replace(replace(replace(coalesce(${columnName}, ''), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')`;
}

export async function getLatestDashboardMonth() {
  const pool = getDbPool();
  const [rows] = await pool.query<LatestMonthRow[]>(
    `
      select max(month_key) as latest_month
      from (
        select date_format(created_at, '%Y-%m') as month_key from customer_contacts
        union all
        select date_format(created_at, '%Y-%m') as month_key from customers
        union all
        select date_format(created_at, '%Y-%m') as month_key from orders
      ) months
    `,
  );

  return rows[0]?.latest_month ?? null;
}

export async function getDefaultDashboardData(range: DashboardDateRange): Promise<DefaultDashboardData> {
  const pool = getDbPool();
  const [summaryRows, contactDailyRows, orderDailyRows, staffRows] = await Promise.all([
    pool.query<SummaryRow[]>(
      `
        select
          (select count(*) from customer_contacts where created_at >= ? and created_at < ?) as new_contacts,
          (select count(*) from customers where created_at >= ? and created_at < ?) as new_customers,
          (select count(*) from orders where created_at >= ? and created_at < ?) as orders,
          (select coalesce(sum(total_charge_vnd), 0) from orders where created_at >= ? and created_at < ?) as revenue_vnd
      `,
      [range.from, range.to, range.from, range.to, range.from, range.to, range.from, range.to],
    ),
    pool.query<ContactDailyRow[]>(
      `
        select date(created_at) as day_key, count(*) as contacts
        from customer_contacts
        where created_at >= ? and created_at < ?
        group by date(created_at)
      `,
      [range.from, range.to],
    ),
    pool.query<OrderDailyRow[]>(
      `
        select date(created_at) as day_key, count(*) as orders, coalesce(sum(total_charge_vnd), 0) as revenue_vnd
        from orders
        where created_at >= ? and created_at < ?
        group by date(created_at)
      `,
      [range.from, range.to],
    ),
    pool.query<StaffReportQueryRow[]>(
      `
        select
          coalesce(s.staff_id, 'unassigned') as staff_id,
          s.staff_code,
          coalesce(s.full_name, 'Chua gan nhan su') as staff_name,
          count(distinct cc.contact_id) as lead_count,
          count(distinct o.order_id) as order_count,
          coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd,
          coalesce(sum(o.paid_amount_vnd), 0) as paid_amount_vnd,
          coalesce(sum(o.remaining_amount_vnd), 0) as remaining_amount_vnd
        from orders o
        left join staff s on s.staff_id = o.assigned_staff_id
        left join customer_contacts cc on
          cc.customer_id = o.customer_id
          or (${normalizedPhoneSql("cc.phone")} <> '' and ${normalizedPhoneSql("cc.phone")} in (${normalizedPhoneSql("o.sender_phone")}, ${normalizedPhoneSql("o.receiver_phone")}))
        where o.created_at >= ? and o.created_at < ?
        group by coalesce(s.staff_id, 'unassigned'), s.staff_code, coalesce(s.full_name, 'Chua gan nhan su')
        order by revenue_vnd desc, order_count desc
      `,
      [range.from, range.to],
    ),
  ]);

  const contactDailyMap = new Map(contactDailyRows[0].map((row) => [String(row.day_key).slice(0, 10), toNumber(row.contacts)]));
  const orderDailyMap = new Map(
    orderDailyRows[0].map((row) => [
      String(row.day_key).slice(0, 10),
      { orders: toNumber(row.orders), revenueVnd: toNumber(row.revenue_vnd) },
    ]),
  );
  const startDate = new Date(`${range.from}T00:00:00.000Z`);
  const endDate = new Date(`${range.to}T00:00:00.000Z`);
  const dayCount = Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000), 0);
  const daily: DefaultDashboardDay[] = Array.from({ length: dayCount }, (_, index) => {
    const date = toDateKey(addDays(startDate, index));
    const orderDay = orderDailyMap.get(date);

    return {
      date,
      contacts: contactDailyMap.get(date) ?? 0,
      orders: orderDay?.orders ?? 0,
      revenueVnd: orderDay?.revenueVnd ?? 0,
    };
  });
  const summaryRow = summaryRows[0][0];

  return {
    fromMonth: range.fromMonth,
    toMonth: range.toMonth,
    summary: {
      newContacts: toNumber(summaryRow?.new_contacts),
      newCustomers: toNumber(summaryRow?.new_customers),
      orders: toNumber(summaryRow?.orders),
      revenueVnd: toNumber(summaryRow?.revenue_vnd),
    },
    daily,
    staffReports: staffRows[0].map((row) => {
      const leadCount = toNumber(row.lead_count);
      const orderCount = toNumber(row.order_count);

      return {
        staffId: row.staff_id ?? "unassigned",
        staffName: row.staff_name ?? "Chua gan nhan su",
        staffCode: row.staff_code,
        leadCount,
        orderCount,
        conversionRate: leadCount > 0 ? orderCount / leadCount : 0,
        revenueVnd: toNumber(row.revenue_vnd),
        paidAmountVnd: toNumber(row.paid_amount_vnd),
        remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      };
    }),
  };
}