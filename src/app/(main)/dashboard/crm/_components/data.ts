import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import { type CrmLeadStatus, crmLeadStatusLabels } from "./constants";

export interface CrmSummary {
  totalLeads: number;
  newLeadsThisMonth: number;
  potentialLeads: number;
  loyalLeads: number;
  silentLeads: number;
  leadsWithOrders: number;
  openLeads: number;
  totalOrders: number;
  leadOrders: number;
  conversionRate: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
}

export interface CrmMonthlyFlow {
  month: string;
  leads: number;
  orders: number;
  leadOrders: number;
  revenueVnd: number;
}

export interface CrmStatusReport {
  status: CrmLeadStatus;
  label: string;
  leadCount: number;
  orderCount: number;
  revenueVnd: number;
}

export interface CrmStaffReport {
  staffId: string;
  staffName: string;
  staffCode: string | null;
  leadCount: number;
  potentialLeadCount: number;
  leadOrderCount: number;
  conversionRate: number;
  revenueVnd: number;
}

export interface CrmRecentLead {
  id: string;
  name: string;
  customerName: string | null;
  staffName: string | null;
  leadStatus: CrmLeadStatus;
  phone: string | null;
  createdAt: string | null;
  orderCount: number;
  totalChargeVnd: number;
  remainingAmountVnd: number;
  lastOrderAt: string | null;
}

export interface CrmAlert {
  id: string;
  title: string;
  description: string;
  count: number;
  tone: "warning" | "info" | "success";
}

export interface CrmDashboardData {
  selectedMonth: string;
  summary: CrmSummary;
  monthlyFlow: CrmMonthlyFlow[];
  statusReports: CrmStatusReport[];
  staffReports: CrmStaffReport[];
  recentLeads: CrmRecentLead[];
  alerts: CrmAlert[];
}

interface LatestMonthRow extends RowDataPacket {
  latest_month: string | null;
}

interface SummaryRow extends RowDataPacket {
  total_leads: number | string | null;
  new_leads_this_month: number | string | null;
  potential_leads: number | string | null;
  loyal_leads: number | string | null;
  silent_leads: number | string | null;
  leads_with_orders: number | string | null;
  open_leads: number | string | null;
  total_orders: number | string | null;
  lead_orders: number | string | null;
  total_revenue_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
}

interface MonthlyFlowRow extends RowDataPacket {
  month_key: string;
  leads: number | string | null;
  orders: number | string | null;
  lead_orders: number | string | null;
  revenue_vnd: number | string | null;
}

interface StatusReportRow extends RowDataPacket {
  lead_status: string | null;
  lead_count: number | string | null;
  order_count: number | string | null;
  revenue_vnd: number | string | null;
}

interface StaffReportRow extends RowDataPacket {
  staff_id: string | null;
  staff_code: string | null;
  staff_name: string | null;
  lead_count: number | string | null;
  potential_lead_count: number | string | null;
  lead_order_count: number | string | null;
  revenue_vnd: number | string | null;
}

interface RecentLeadRow extends RowDataPacket {
  contact_id: string;
  contact_name: string | null;
  customer_name: string | null;
  staff_name: string | null;
  lead_status: string | null;
  phone: string | null;
  created_at: Date | string | null;
  order_count: number | string | null;
  total_charge_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  last_order_at: Date | string | null;
}

interface AlertRow extends RowDataPacket {
  unassigned_leads: number | string | null;
  silent_leads: number | string | null;
  leads_without_orders: number | string | null;
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

function normalizeLeadStatus(value: string | null | undefined): CrmLeadStatus {
  return value === "potential" || value === "loyal" || value === "silent" || value === "new" ? value : "new";
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

function contactOrderMatchSql(contactAlias = "cc", orderAlias = "o") {
  return `
    (
      ${contactAlias}.customer_id = ${orderAlias}.customer_id
      or (
        ${normalizedPhoneSql(`${contactAlias}.phone`)} <> ''
        and ${normalizedPhoneSql(`${contactAlias}.phone`)} in (
          ${normalizedPhoneSql(`${orderAlias}.sender_phone`)},
          ${normalizedPhoneSql(`${orderAlias}.receiver_phone`)}
        )
      )
    )
  `;
}

function monthRange(selectedMonth: string, months: number) {
  const [year, month] = selectedMonth.split("-").map(Number);
  const to = new Date(Date.UTC(year, month, 1));
  const from = new Date(Date.UTC(year, month - months, 1));

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export async function getLatestCrmMonth() {
  const pool = getDbPool();
  const [rows] = await pool.query<LatestMonthRow[]>(
    `
      select max(month_key) as latest_month
      from (
        select date_format(created_at, '%Y-%m') as month_key from customer_contacts
        union all
        select date_format(created_at, '%Y-%m') as month_key from orders
      ) months
    `,
  );

  return rows[0]?.latest_month ?? new Date().toISOString().slice(0, 7);
}

export async function getCrmDashboardData(): Promise<CrmDashboardData> {
  const pool = getDbPool();
  const selectedMonth = await getLatestCrmMonth();
  const range = monthRange(selectedMonth, 6);
  const selectedMonthStart = `${selectedMonth}-01`;
  const selectedMonthEnd = monthRange(selectedMonth, 0).to;
  const leadOrderCondition = orderHasLeadSql("o");
  const contactOrderMatch = contactOrderMatchSql("cc", "o");

  const [summaryRows, monthlyRows, statusRows, staffRows, recentRows, alertRows] = await Promise.all([
    pool.query<SummaryRow[]>(
      `
        select
          count(distinct cc.contact_id) as total_leads,
          count(distinct case when cc.created_at >= ? and cc.created_at < ? then cc.contact_id end) as new_leads_this_month,
          count(distinct case when cc.lead_status = 'potential' then cc.contact_id end) as potential_leads,
          count(distinct case when cc.lead_status = 'loyal' then cc.contact_id end) as loyal_leads,
          count(distinct case when cc.lead_status = 'silent' then cc.contact_id end) as silent_leads,
          count(distinct case when matched_orders.order_id is not null then cc.contact_id end) as leads_with_orders,
          count(distinct case when cc.lead_status in ('new', 'potential') then cc.contact_id end) as open_leads,
          (select count(*) from orders) as total_orders,
          (select count(*) from orders o where ${leadOrderCondition}) as lead_orders,
          coalesce((select sum(o.total_charge_vnd) from orders o where ${leadOrderCondition}), 0) as total_revenue_vnd,
          coalesce((select sum(o.remaining_amount_vnd) from orders o where ${leadOrderCondition}), 0) as total_receivable_vnd
        from customer_contacts cc
        left join orders matched_orders on ${contactOrderMatchSql("cc", "matched_orders")}
      `,
      [selectedMonthStart, selectedMonthEnd],
    ),
    pool.query<MonthlyFlowRow[]>(
      `
        select
          months.month_key,
          coalesce(leads.leads, 0) as leads,
          coalesce(orders.orders, 0) as orders,
          coalesce(orders.lead_orders, 0) as lead_orders,
          coalesce(orders.revenue_vnd, 0) as revenue_vnd
        from (
          select date_format(date_add(?, interval seq.n month), '%Y-%m') as month_key
          from (
            select 0 as n union all select 1 union all select 2 union all select 3 union all select 4 union all select 5
          ) seq
        ) months
        left join (
          select date_format(created_at, '%Y-%m') as month_key, count(*) as leads
          from customer_contacts
          where created_at >= ? and created_at < ?
          group by date_format(created_at, '%Y-%m')
        ) leads on leads.month_key = months.month_key
        left join (
          select
            date_format(o.created_at, '%Y-%m') as month_key,
            count(*) as orders,
            sum(case when ${leadOrderCondition} then 1 else 0 end) as lead_orders,
            coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd
          from orders o
          where o.created_at >= ? and o.created_at < ?
          group by date_format(o.created_at, '%Y-%m')
        ) orders on orders.month_key = months.month_key
        order by months.month_key
      `,
      [range.from, range.from, range.to, range.from, range.to],
    ),
    pool.query<StatusReportRow[]>(
      `
        select
          cc.lead_status,
          count(distinct cc.contact_id) as lead_count,
          count(distinct o.order_id) as order_count,
          coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd
        from customer_contacts cc
        left join orders o on ${contactOrderMatch}
        group by cc.lead_status
        order by field(cc.lead_status, 'new', 'potential', 'loyal', 'silent')
      `,
    ),
    pool.query<StaffReportRow[]>(
      `
        select
          coalesce(cc.assigned_staff_id, 'unassigned') as staff_id,
          s.staff_code,
          coalesce(s.full_name, 'Chua gan nhan su') as staff_name,
          count(distinct cc.contact_id) as lead_count,
          count(distinct case when cc.lead_status = 'potential' then cc.contact_id end) as potential_lead_count,
          count(distinct o.order_id) as lead_order_count,
          coalesce(sum(o.total_charge_vnd), 0) as revenue_vnd
        from customer_contacts cc
        left join staff s on s.staff_id = cc.assigned_staff_id
        left join orders o on ${contactOrderMatch}
        group by coalesce(cc.assigned_staff_id, 'unassigned'), s.staff_code, coalesce(s.full_name, 'Chua gan nhan su')
        order by revenue_vnd desc, lead_order_count desc, lead_count desc
        limit 8
      `,
    ),
    pool.query<RecentLeadRow[]>(
      `
        select
          cc.contact_id,
          cc.contact_name,
          c.customer_name,
          s.full_name as staff_name,
          cc.lead_status,
          cc.phone,
          cc.created_at,
          count(distinct o.order_id) as order_count,
          coalesce(sum(o.total_charge_vnd), 0) as total_charge_vnd,
          coalesce(sum(o.remaining_amount_vnd), 0) as remaining_amount_vnd,
          max(coalesce(o.created_at, o.order_date)) as last_order_at
        from customer_contacts cc
        left join customers c on c.customer_id = cc.customer_id
        left join staff s on s.staff_id = cc.assigned_staff_id
        left join orders o on ${contactOrderMatch}
        group by cc.contact_id, cc.contact_name, c.customer_name, s.full_name, cc.lead_status, cc.phone, cc.created_at
        order by coalesce(cc.updated_at, cc.created_at) desc
        limit 100
      `,
    ),
    pool.query<AlertRow[]>(
      `
        select
          count(distinct case when cc.assigned_staff_id is null then cc.contact_id end) as unassigned_leads,
          count(distinct case when cc.lead_status = 'silent' then cc.contact_id end) as silent_leads,
          count(distinct cc.contact_id) - count(distinct case when matched_orders.order_id is not null then cc.contact_id end) as leads_without_orders
        from customer_contacts cc
        left join orders matched_orders on ${contactOrderMatchSql("cc", "matched_orders")}
      `,
    ),
  ]);

  const summaryRow = summaryRows[0][0];
  const totalLeads = toNumber(summaryRow?.total_leads);
  const leadsWithOrders = toNumber(summaryRow?.leads_with_orders);
  const alertRow = alertRows[0][0];

  return {
    selectedMonth,
    summary: {
      totalLeads,
      newLeadsThisMonth: toNumber(summaryRow?.new_leads_this_month),
      potentialLeads: toNumber(summaryRow?.potential_leads),
      loyalLeads: toNumber(summaryRow?.loyal_leads),
      silentLeads: toNumber(summaryRow?.silent_leads),
      leadsWithOrders,
      openLeads: toNumber(summaryRow?.open_leads),
      totalOrders: toNumber(summaryRow?.total_orders),
      leadOrders: toNumber(summaryRow?.lead_orders),
      conversionRate: totalLeads > 0 ? leadsWithOrders / totalLeads : 0,
      totalRevenueVnd: toNumber(summaryRow?.total_revenue_vnd),
      totalReceivableVnd: toNumber(summaryRow?.total_receivable_vnd),
    },
    monthlyFlow: monthlyRows[0].map((row) => ({
      month: row.month_key,
      leads: toNumber(row.leads),
      orders: toNumber(row.orders),
      leadOrders: toNumber(row.lead_orders),
      revenueVnd: toNumber(row.revenue_vnd),
    })),
    statusReports: statusRows[0].map((row) => {
      const status = normalizeLeadStatus(row.lead_status);

      return {
        status,
        label: crmLeadStatusLabels[status],
        leadCount: toNumber(row.lead_count),
        orderCount: toNumber(row.order_count),
        revenueVnd: toNumber(row.revenue_vnd),
      };
    }),
    staffReports: staffRows[0].map((row) => {
      const leadCount = toNumber(row.lead_count);
      const leadOrderCount = toNumber(row.lead_order_count);

      return {
        staffId: row.staff_id ?? "unassigned",
        staffName: row.staff_name ?? "Ch\u01b0a g\u00e1n nh\u00e2n s\u1ef1",
        staffCode: row.staff_code,
        leadCount,
        potentialLeadCount: toNumber(row.potential_lead_count),
        leadOrderCount,
        conversionRate: leadCount > 0 ? leadOrderCount / leadCount : 0,
        revenueVnd: toNumber(row.revenue_vnd),
      };
    }),
    recentLeads: recentRows[0].map((row) => ({
      id: row.contact_id,
      name: row.contact_name ?? "Ch\u01b0a c\u00f3 t\u00ean lead",
      customerName: row.customer_name,
      staffName: row.staff_name,
      leadStatus: normalizeLeadStatus(row.lead_status),
      phone: row.phone,
      createdAt: toDateString(row.created_at),
      orderCount: toNumber(row.order_count),
      totalChargeVnd: toNumber(row.total_charge_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      lastOrderAt: toDateString(row.last_order_at),
    })),
    alerts: [
      {
        id: "unassigned-leads",
        title: "Lead ch\u01b0a g\u00e1n nh\u00e2n s\u1ef1",
        description:
          "C\u1ea7n ph\u00e2n c\u00f4ng ng\u01b0\u1eddi ph\u1ee5 tr\u00e1ch \u0111\u1ec3 tr\u00e1nh b\u1ecf s\u00f3t ch\u0103m s\u00f3c.",
        count: toNumber(alertRow?.unassigned_leads),
        tone: "warning",
      },
      {
        id: "silent-leads",
        title: "Lead im l\u1eb7ng",
        description:
          "Nh\u00f3m c\u1ea7n ki\u1ec3m tra l\u1ea1i l\u1ecbch s\u1eed li\u00ean h\u1ec7 ho\u1eb7c chuy\u1ec3n tr\u1ea1ng th\u00e1i.",
        count: toNumber(alertRow?.silent_leads),
        tone: "info",
      },
      {
        id: "leads-without-orders",
        title: "Lead ch\u01b0a ph\u00e1t sinh \u0111\u01a1n",
        description:
          "Theo d\u00f5i nh\u00f3m lead ch\u01b0a chuy\u1ec3n \u0111\u1ed5i th\u00e0nh \u0111\u01a1n h\u00e0ng.",
        count: toNumber(alertRow?.leads_without_orders),
        tone: "success",
      },
    ],
  };
}
