import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export interface AnalyticsKpi {
  key: string;
  title: string;
  value: string;
  detail: string;
  trendPercent: number;
}

export interface AnalyticsDailyPoint {
  date: string;
  leads: number;
  orders: number;
  leadOrders: number;
  revenueVnd: number;
  receivableVnd: number;
}

export interface AnalyticsStaffRow {
  staffId: string;
  staffName: string;
  staffCode: string | null;
  leads: number;
  orders: number;
  leadOrders: number;
  revenueVnd: number;
  conversionRate: number;
}

export interface AnalyticsBarRow {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
}

export interface AnalyticsData {
  rangeLabel: string;
  kpis: AnalyticsKpi[];
  daily: AnalyticsDailyPoint[];
  staffRows: AnalyticsStaffRow[];
  leadStatusRows: AnalyticsBarRow[];
  collectionRows: AnalyticsBarRow[];
  customerRows: AnalyticsBarRow[];
  liveOrders: number;
  liveLeads: number;
  revenuePending: boolean;
}

interface LatestDateRow extends RowDataPacket {
  latest_date: Date | string | null;
}

interface SummaryRow extends RowDataPacket {
  leads: number | string | null;
  orders: number | string | null;
  lead_orders: number | string | null;
  old_customer_orders: number | string | null;
  revenue_vnd: number | string | null;
  receivable_vnd: number | string | null;
  previous_leads: number | string | null;
  previous_orders: number | string | null;
  previous_lead_orders: number | string | null;
  previous_revenue_vnd: number | string | null;
}

interface DailyRow extends RowDataPacket {
  day_key: Date | string;
  leads: number | string | null;
  orders: number | string | null;
  lead_orders: number | string | null;
  revenue_vnd: number | string | null;
  receivable_vnd: number | string | null;
}

interface StaffRow extends RowDataPacket {
  staff_id: string | null;
  staff_code: string | null;
  staff_name: string | null;
  leads: number | string | null;
  orders: number | string | null;
  lead_orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface BarRow extends RowDataPacket {
  row_key: string | null;
  label: string | null;
  value: number | string | null;
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

function toDateString(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toDateKey(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

function formatVnd(value: number) {
  return `${formatCompact(value)} d`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function trendPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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

function monthLabel(from: string, to: string) {
  return `${from.slice(8, 10)}/${from.slice(5, 7)} - ${to.slice(8, 10)}/${to.slice(5, 7)}`;
}

function mapBarRows(rows: BarRow[], fallbackLabel: string, formatter: (value: number) => string = formatCompact) {
  return rows.map((row) => {
    const value = toNumber(row.value);

    return {
      key: row.row_key ?? row.label ?? fallbackLabel,
      label: row.label ?? fallbackLabel,
      value,
      formattedValue: formatter(value),
    };
  });
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const pool = getDbPool();
  const [latestRows] = await pool.query<LatestDateRow[]>(
    `
      select max(day_key) as latest_date
      from (
        select date(created_at) as day_key from customer_contacts
        union all
        select date(coalesce(order_date, created_at)) as day_key from orders
      ) latest
    `,
  );

  const latestDateKey = toDateString(latestRows[0]?.latest_date) ?? new Date().toISOString().slice(0, 10);
  const rangeEndDate = addDays(new Date(`${latestDateKey}T00:00:00.000Z`), 1);
  const rangeStartDate = addDays(rangeEndDate, -30);
  const previousStartDate = addDays(rangeStartDate, -30);
  const rangeStart = toDateKey(rangeStartDate);
  const rangeEnd = toDateKey(rangeEndDate);
  const previousStart = toDateKey(previousStartDate);
  const leadOrderCondition = orderHasLeadSql("o");

  const [summaryRows, dailyRows, staffRows, leadStatusRows, collectionRows, customerRows] = await Promise.all([
    pool.query<SummaryRow[]>(
      `
        select
          (select count(*) from customer_contacts where created_at >= ? and created_at < ?) as leads,
          (select count(*) from orders where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?) as orders,
          (select count(*) from orders o where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ? and ${leadOrderCondition}) as lead_orders,
          (select count(*) from orders o where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ? and not ${leadOrderCondition}) as old_customer_orders,
          (select coalesce(sum(total_charge_vnd), 0) from orders where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?) as revenue_vnd,
          (select coalesce(sum(remaining_amount_vnd), 0) from orders where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?) as receivable_vnd,
          (select count(*) from customer_contacts where created_at >= ? and created_at < ?) as previous_leads,
          (select count(*) from orders where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?) as previous_orders,
          (select count(*) from orders o where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ? and ${leadOrderCondition}) as previous_lead_orders,
          (select coalesce(sum(total_charge_vnd), 0) from orders where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?) as previous_revenue_vnd
      `,
      [
        rangeStart,
        rangeEnd,
        rangeStart,
        rangeEnd,
        rangeStart,
        rangeEnd,
        rangeStart,
        rangeEnd,
        rangeStart,
        rangeEnd,
        rangeStart,
        rangeEnd,
        previousStart,
        rangeStart,
        previousStart,
        rangeStart,
        previousStart,
        rangeStart,
        previousStart,
        rangeStart,
      ],
    ),
    pool.query<DailyRow[]>(
      `
        select
          days.day_key,
          coalesce(leads.leads, 0) as leads,
          coalesce(orders.orders, 0) as orders,
          coalesce(orders.lead_orders, 0) as lead_orders,
          coalesce(orders.revenue_vnd, 0) as revenue_vnd,
          coalesce(orders.receivable_vnd, 0) as receivable_vnd
        from (
          select date(created_at) as day_key
          from customer_contacts
          where created_at >= ? and created_at < ?
          union
          select date(coalesce(order_date, created_at)) as day_key
          from orders
          where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?
        ) days
        left join (
          select date(created_at) as day_key, count(*) as leads
          from customer_contacts
          where created_at >= ? and created_at < ?
          group by date(created_at)
        ) leads on leads.day_key = days.day_key
        left join (
          select
            date(coalesce(o.order_date, o.created_at)) as day_key,
            count(*) as orders,
            sum(case when ${leadOrderCondition} then 1 else 0 end) as lead_orders,
            coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd,
            coalesce(sum(o.remaining_amount_vnd), 0) as receivable_vnd
          from orders o
          where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ?
          group by date(coalesce(o.order_date, o.created_at))
        ) orders on orders.day_key = days.day_key
        order by days.day_key
      `,
      [rangeStart, rangeEnd, rangeStart, rangeEnd, rangeStart, rangeEnd, rangeStart, rangeEnd],
    ),
    pool.query<StaffRow[]>(
      `
        select
          staff_keys.staff_id,
          s.staff_code,
          coalesce(s.full_name, 'Chưa gán nhân sự') as staff_name,
          coalesce(leads.leads, 0) as leads,
          coalesce(orders.orders, 0) as orders,
          coalesce(orders.lead_orders, 0) as lead_orders,
          coalesce(orders.revenue_vnd, 0) as revenue_vnd
        from (
          select coalesce(assigned_staff_id, 'unassigned') as staff_id
          from customer_contacts
          where created_at >= ? and created_at < ?
          union
          select coalesce(assigned_staff_id, 'unassigned') as staff_id
          from orders
          where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?
        ) staff_keys
        left join staff s on s.staff_id = staff_keys.staff_id
        left join (
          select coalesce(assigned_staff_id, 'unassigned') as staff_id, count(*) as leads
          from customer_contacts
          where created_at >= ? and created_at < ?
          group by coalesce(assigned_staff_id, 'unassigned')
        ) leads on leads.staff_id = staff_keys.staff_id
        left join (
          select
            coalesce(o.assigned_staff_id, 'unassigned') as staff_id,
            count(*) as orders,
            sum(case when ${leadOrderCondition} then 1 else 0 end) as lead_orders,
            coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd
          from orders o
          where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ?
          group by coalesce(o.assigned_staff_id, 'unassigned')
        ) orders on orders.staff_id = staff_keys.staff_id
        order by revenue_vnd desc, orders desc, leads desc
        limit 8
      `,
      [rangeStart, rangeEnd, rangeStart, rangeEnd, rangeStart, rangeEnd, rangeStart, rangeEnd],
    ),
    pool.query<BarRow[]>(
      `
        select
          lead_statuses.row_key,
          case lead_statuses.row_key
            when 'potential' then 'Lead tiềm năng'
            when 'loyal' then 'Khách thân thiết'
            when 'silent' then 'Lead im lặng'
            else 'Lead mới'
          end as label,
          lead_statuses.value
        from (
          select coalesce(lead_status, 'new') as row_key, count(*) as value
          from customer_contacts
          where created_at >= ? and created_at < ?
          group by coalesce(lead_status, 'new')
        ) lead_statuses
        order by field(lead_statuses.row_key, 'new', 'potential', 'loyal', 'silent')
      `,
      [rangeStart, rangeEnd],
    ),
    pool.query<BarRow[]>(
      `
        select
          collection_statuses.row_key,
          case collection_statuses.row_key
            when 'paid' then 'Đã thu'
            when 'partial' then 'Thu một phần'
            when 'overdue' then 'Quá hạn'
            else 'Chưa thu'
          end as label,
          collection_statuses.value
        from (
          select coalesce(collection_status, 'pending') as row_key, coalesce(sum(remaining_amount_vnd), 0) as value
          from orders
          where coalesce(order_date, created_at) >= ? and coalesce(order_date, created_at) < ?
          group by coalesce(collection_status, 'pending')
        ) collection_statuses
        order by collection_statuses.value desc
        limit 5
      `,
      [rangeStart, rangeEnd],
    ),
    pool.query<BarRow[]>(
      `
        select
          customer_type as row_key,
          case customer_type
            when 'lead' then 'Đơn theo lead'
            else 'Đơn khách cũ'
          end as label,
          count(*) as value
        from (
          select case when ${leadOrderCondition} then 'lead' else 'old_customer' end as customer_type
          from orders o
          where coalesce(o.order_date, o.created_at) >= ? and coalesce(o.order_date, o.created_at) < ?
        ) segments
        group by customer_type
        order by value desc
      `,
      [rangeStart, rangeEnd],
    ),
  ]);

  const summary = summaryRows[0][0];
  const leads = toNumber(summary?.leads);
  const orders = toNumber(summary?.orders);
  const leadOrders = toNumber(summary?.lead_orders);
  const revenueVnd = toNumber(summary?.revenue_vnd);
  const receivableVnd = toNumber(summary?.receivable_vnd);
  const previousLeads = toNumber(summary?.previous_leads);
  const previousOrders = toNumber(summary?.previous_orders);
  const previousLeadOrders = toNumber(summary?.previous_lead_orders);
  const previousRevenueVnd = toNumber(summary?.previous_revenue_vnd);
  const conversionRate = leads > 0 ? leadOrders / leads : 0;
  const previousConversionRate = previousLeads > 0 ? previousLeadOrders / previousLeads : 0;
  const dailyMap = new Map(
    dailyRows[0].map((row) => [
      toDateString(row.day_key) ?? String(row.day_key).slice(0, 10),
      {
        leads: toNumber(row.leads),
        orders: toNumber(row.orders),
        leadOrders: toNumber(row.lead_orders),
        revenueVnd: toNumber(row.revenue_vnd),
        receivableVnd: toNumber(row.receivable_vnd),
      },
    ]),
  );
  const daily = Array.from({ length: 30 }, (_, index) => {
    const date = toDateKey(addDays(rangeStartDate, index));
    const day = dailyMap.get(date);

    return {
      date,
      leads: day?.leads ?? 0,
      orders: day?.orders ?? 0,
      leadOrders: day?.leadOrders ?? 0,
      revenueVnd: day?.revenueVnd ?? 0,
      receivableVnd: day?.receivableVnd ?? 0,
    };
  });

  return {
    rangeLabel: monthLabel(rangeStart, latestDateKey),
    kpis: [
      {
        key: "leads",
        title: "Lead mới",
        value: formatCompact(leads),
        detail: `Kỳ trước ${formatCompact(previousLeads)}`,
        trendPercent: trendPercent(leads, previousLeads),
      },
      {
        key: "orders",
        title: "Tổng đơn hàng",
        value: formatCompact(orders),
        detail: `Đơn theo lead ${formatCompact(leadOrders)}`,
        trendPercent: trendPercent(orders, previousOrders),
      },
      {
        key: "conversion",
        title: "Tỷ lệ chuyển đổi",
        value: formatPercent(conversionRate),
        detail: "Tính theo đơn hàng theo lead",
        trendPercent: (conversionRate - previousConversionRate) * 100,
      },
      {
        key: "revenue",
        title: "Doanh thu đối soát",
        value: revenueVnd > 0 ? formatVnd(revenueVnd) : "Đang đối soát",
        detail: revenueVnd > 0 ? `Kỳ trước ${formatVnd(previousRevenueVnd)}` : "Sẽ hiển thị sau khi tính xong",
        trendPercent: trendPercent(revenueVnd, previousRevenueVnd),
      },
      {
        key: "receivable",
        title: "Công nợ còn lại",
        value: formatVnd(receivableVnd),
        detail: "Theo remaining_amount_vnd",
        trendPercent: receivableVnd > 0 ? 0 : 0,
      },
    ],
    daily,
    staffRows: staffRows[0].map((row) => {
      const staffLeads = toNumber(row.leads);
      const staffLeadOrders = toNumber(row.lead_orders);

      return {
        staffId: row.staff_id ?? "unassigned",
        staffName: row.staff_name ?? "Chưa gán nhân sự",
        staffCode: row.staff_code,
        leads: staffLeads,
        orders: toNumber(row.orders),
        leadOrders: staffLeadOrders,
        revenueVnd: toNumber(row.revenue_vnd),
        conversionRate: staffLeads > 0 ? staffLeadOrders / staffLeads : 0,
      };
    }),
    leadStatusRows: mapBarRows(leadStatusRows[0], "Lead", formatCompact),
    collectionRows: mapBarRows(collectionRows[0], "Công nợ", formatVnd),
    customerRows: mapBarRows(customerRows[0], "Đơn hàng", formatCompact),
    liveOrders: daily.at(-1)?.orders ?? 0,
    liveLeads: daily.at(-1)?.leads ?? 0,
    revenuePending: orders > 0 && revenueVnd === 0,
  };
}
