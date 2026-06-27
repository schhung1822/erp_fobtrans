import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export interface DefaultDashboardSummary {
  newContacts: number;
  newCustomers: number;
  orders: number;
  leadOrders: number;
  oldCustomerOrders: number;
  revenueVnd: number;
}

export interface DefaultDashboardDay {
  date: string;
  contacts: number;
  orders: number;
  leadOrders: number;
  oldCustomerOrders: number;
  revenueVnd: number;
}

export interface StaffOrderReportRow {
  staffId: string;
  staffName: string;
  staffCode: string | null;
  leadCount: number;
  orderCount: number;
  leadOrderCount: number;
  oldCustomerOrderCount: number;
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
  lead_orders: number | string | null;
  old_customer_orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface ContactDailyRow extends RowDataPacket {
  day_key: string;
  contacts: number | string | null;
}

interface OrderDailyRow extends RowDataPacket {
  day_key: string;
  orders: number | string | null;
  lead_orders: number | string | null;
  old_customer_orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface StaffReportQueryRow extends RowDataPacket {
  staff_id: string | null;
  staff_code: string | null;
  staff_name: string | null;
  lead_count: number | string | null;
  order_count: number | string | null;
  lead_order_count: number | string | null;
  old_customer_order_count: number | string | null;
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

function orderHasLeadSql(orderAlias = "o") {
  return `
    exists (
      select 1
      from customer_contacts cc_match
      where
        cc_match.customer_id = ${orderAlias}.customer_id
        or (
          ${normalizedPhoneSql("cc_match.phone")} <> ''
          and ${normalizedPhoneSql("cc_match.phone")} in (
            ${normalizedPhoneSql(`${orderAlias}.sender_phone`)},
            ${normalizedPhoneSql(`${orderAlias}.receiver_phone`)}
          )
        )
    )
  `;
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
  const leadOrderCondition = orderHasLeadSql("o");
  const [summaryRows, contactDailyRows, orderDailyRows, staffRows] = await Promise.all([
    pool.query<SummaryRow[]>(
      `
        select
          (select count(*) from customer_contacts where created_at >= ? and created_at < ?) as new_contacts,
          (select count(*) from customers where created_at >= ? and created_at < ?) as new_customers,
          (select count(*) from orders where created_at >= ? and created_at < ?) as orders,
          (select count(*) from orders o where o.created_at >= ? and o.created_at < ? and ${leadOrderCondition}) as lead_orders,
          (select count(*) from orders o where o.created_at >= ? and o.created_at < ? and not ${leadOrderCondition}) as old_customer_orders,
          (select coalesce(sum(total_charge_vnd), 0) from orders where created_at >= ? and created_at < ?) as revenue_vnd
      `,
      [
        range.from,
        range.to,
        range.from,
        range.to,
        range.from,
        range.to,
        range.from,
        range.to,
        range.from,
        range.to,
        range.from,
        range.to,
      ],
    ),
    pool.query<ContactDailyRow[]>(
      `
        select date_format(created_at, '%Y-%m-%d') as day_key, count(*) as contacts
        from customer_contacts
        where created_at >= ? and created_at < ?
        group by date_format(created_at, '%Y-%m-%d')
      `,
      [range.from, range.to],
    ),
    pool.query<OrderDailyRow[]>(
      `
        select
          date_format(o.created_at, '%Y-%m-%d') as day_key,
          count(*) as orders,
          sum(case when ${leadOrderCondition} then 1 else 0 end) as lead_orders,
          sum(case when not ${leadOrderCondition} then 1 else 0 end) as old_customer_orders,
          coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd
        from orders o
        where o.created_at >= ? and o.created_at < ?
        group by date_format(o.created_at, '%Y-%m-%d')
      `,
      [range.from, range.to],
    ),
    pool.query<StaffReportQueryRow[]>(
      `
        select
          staff_keys.staff_id,
          s.staff_code,
          coalesce(s.full_name, 'Chua gan nhan su') as staff_name,
          coalesce(leads.lead_count, 0) as lead_count,
          coalesce(orders.order_count, 0) as order_count,
          coalesce(orders.lead_order_count, 0) as lead_order_count,
          coalesce(orders.old_customer_order_count, 0) as old_customer_order_count,
          coalesce(orders.revenue_vnd, 0) as revenue_vnd,
          coalesce(orders.paid_amount_vnd, 0) as paid_amount_vnd,
          coalesce(orders.remaining_amount_vnd, 0) as remaining_amount_vnd
        from (
          select coalesce(assigned_staff_id, 'unassigned') as staff_id
          from customer_contacts
          where created_at >= ? and created_at < ?
          union
          select coalesce(assigned_staff_id, 'unassigned') as staff_id
          from orders
          where created_at >= ? and created_at < ?
        ) staff_keys
        left join staff s on s.staff_id = staff_keys.staff_id
        left join (
          select coalesce(assigned_staff_id, 'unassigned') as staff_id, count(*) as lead_count
          from customer_contacts
          where created_at >= ? and created_at < ?
          group by coalesce(assigned_staff_id, 'unassigned')
        ) leads on leads.staff_id = staff_keys.staff_id
        left join (
          select
            coalesce(o.assigned_staff_id, 'unassigned') as staff_id,
            count(*) as order_count,
            sum(case when ${leadOrderCondition} then 1 else 0 end) as lead_order_count,
            sum(case when not ${leadOrderCondition} then 1 else 0 end) as old_customer_order_count,
            coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd,
            coalesce(sum(o.paid_amount_vnd), 0) as paid_amount_vnd,
            coalesce(sum(o.remaining_amount_vnd), 0) as remaining_amount_vnd
          from orders o
          where o.created_at >= ? and o.created_at < ?
          group by coalesce(o.assigned_staff_id, 'unassigned')
        ) orders on orders.staff_id = staff_keys.staff_id
        order by revenue_vnd desc, order_count desc, lead_count desc
      `,
      [range.from, range.to, range.from, range.to, range.from, range.to, range.from, range.to],
    ),
  ]);

  const contactDailyMap = new Map(
    contactDailyRows[0].map((row) => [String(row.day_key).slice(0, 10), toNumber(row.contacts)]),
  );
  const orderDailyMap = new Map(
    orderDailyRows[0].map((row) => [
      String(row.day_key).slice(0, 10),
      {
        orders: toNumber(row.orders),
        leadOrders: toNumber(row.lead_orders),
        oldCustomerOrders: toNumber(row.old_customer_orders),
        revenueVnd: toNumber(row.revenue_vnd),
      },
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
      leadOrders: orderDay?.leadOrders ?? 0,
      oldCustomerOrders: orderDay?.oldCustomerOrders ?? 0,
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
      leadOrders: toNumber(summaryRow?.lead_orders),
      oldCustomerOrders: toNumber(summaryRow?.old_customer_orders),
      revenueVnd: toNumber(summaryRow?.revenue_vnd),
    },
    daily,
    staffReports: staffRows[0].map((row) => {
      const leadCount = toNumber(row.lead_count);
      const leadOrderCount = toNumber(row.lead_order_count);

      return {
        staffId: row.staff_id ?? "unassigned",
        staffName: row.staff_name ?? "Chua gan nhan su",
        staffCode: row.staff_code,
        leadCount,
        orderCount: toNumber(row.order_count),
        leadOrderCount,
        oldCustomerOrderCount: toNumber(row.old_customer_order_count),
        conversionRate: leadCount > 0 ? leadOrderCount / leadCount : 0,
        revenueVnd: toNumber(row.revenue_vnd),
        paidAmountVnd: toNumber(row.paid_amount_vnd),
        remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      };
    }),
  };
}
