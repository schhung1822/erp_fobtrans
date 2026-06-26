import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export type FinanceEntry = {
  orderId: string;
  orderCode: string;
  customerCode: string | null;
  customerName: string;
  staffName: string | null;
  cargoName: string | null;
  deliveryDate: string | null;
  paymentDueDate: string | null;
  collectionStatus: string;
  invoiceStatus: string;
  packages: number;
  weightKg: number;
  volumeM3: number;
  totalCostVnd: number;
  businessCostVnd: number;
  totalChargeVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  grossProfitVnd: number;
  businessProfitVnd: number;
  importTaxCostVnd: number;
  vatCostVnd: number;
  chinaDomesticCostVnd: number;
  vietnamDomesticCostVnd: number;
  threeWheelFeeVnd: number;
  customsCostVnd: number;
  seaFreightCostVnd: number;
  otherCostVnd: number;
  customerFreightVnd: number;
  chinaDomesticChargeVnd: number;
  importTaxChargeVnd: number;
  vatChargeVnd: number;
  surchargeVnd: number;
  customsChargeVnd: number;
  seaFreightChargeVnd: number;
  otherRevenueVnd: number;
  revenueDiscountVnd: number;
};

export type FinanceSummary = {
  month: string;
  totalOrders: number;
  totalRevenueVnd: number;
  totalCollectedVnd: number;
  totalReceivableVnd: number;
  totalCostVnd: number;
  totalBusinessCostVnd: number;
  grossProfitVnd: number;
  businessProfitVnd: number;
  importTaxVnd: number;
  vatVnd: number;
  taxAdvanceVnd: number;
  invoiceAmountVnd: number;
  overdueAmountVnd: number;
  collectionRatePercent: number;
};

export type StaffFinance = {
  staffName: string;
  totalOrders: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
  grossProfitVnd: number;
};

export type FinanceData = {
  availableMonths: string[];
  entries: FinanceEntry[];
  staffRows: StaffFinance[];
  summary: FinanceSummary;
};

interface MonthRow extends RowDataPacket {
  month_value: string | null;
}

interface FinanceEntryRow extends RowDataPacket {
  order_id: string;
  order_code: string;
  customer_code: string | null;
  customer_name: string | null;
  full_name: string | null;
  cargo_name: string | null;
  delivery_date: Date | string | null;
  payment_due_date: Date | string | null;
  collection_status: string;
  invoice_status: string;
  total_packages: number | string | null;
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  total_cost_vnd: number | string | null;
  total_business_cost_vnd: number | string | null;
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  gross_profit_vnd: number | string | null;
  business_profit_vnd: number | string | null;
  import_tax_cost_vnd: number | string | null;
  vat_cost_vnd: number | string | null;
  china_domestic_cost_vnd: number | string | null;
  vietnam_domestic_cost_vnd: number | string | null;
  three_wheel_fee_vnd: number | string | null;
  customs_cost_vnd: number | string | null;
  sea_freight_cost_vnd: number | string | null;
  other_cost_vnd: number | string | null;
  customer_freight_vnd: number | string | null;
  china_domestic_charge_vnd: number | string | null;
  import_tax_charge_vnd: number | string | null;
  vat_charge_vnd: number | string | null;
  surcharge_vnd: number | string | null;
  customs_charge_vnd: number | string | null;
  sea_freight_charge_vnd: number | string | null;
  other_revenue_vnd: number | string | null;
  revenue_discount_vnd: number | string | null;
}

interface SummaryRow extends RowDataPacket {
  total_orders: number | string | null;
  total_revenue_vnd: number | string | null;
  total_collected_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
  total_cost_vnd: number | string | null;
  total_business_cost_vnd: number | string | null;
  gross_profit_vnd: number | string | null;
  business_profit_vnd: number | string | null;
  import_tax_vnd: number | string | null;
  vat_vnd: number | string | null;
  overdue_amount_vnd: number | string | null;
}

interface TaxRow extends RowDataPacket {
  import_tax_amount: number | string | null;
  vat_amount: number | string | null;
  tax_advance_amount: number | string | null;
}

interface InvoiceRow extends RowDataPacket {
  invoice_amount: number | string | null;
}

interface StaffRow extends RowDataPacket {
  staff_name: string | null;
  total_orders: number | string | null;
  total_revenue_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
  gross_profit_vnd: number | string | null;
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

function normalizeMonth(month: string | undefined, fallback: string) {
  if (month && /^\d{4}-\d{2}$/.test(month)) return month;
  return fallback;
}

export async function getFinanceData(monthParam?: string): Promise<FinanceData> {
  const pool = getDbPool();
  const [monthRows] = await pool.query<MonthRow[]>(
    `
      select distinct coalesce(order_month, date_format(coalesce(delivery_date, order_date, created_at), '%Y-%m')) as month_value
      from orders
      where coalesce(order_month, date_format(coalesce(delivery_date, order_date, created_at), '%Y-%m')) is not null
      order by month_value desc
      limit 18
    `,
  );
  const availableMonths = monthRows.map((row) => row.month_value).filter(Boolean) as string[];
  const selectedMonth = normalizeMonth(monthParam, availableMonths[0] ?? new Date().toISOString().slice(0, 7));

  const monthWhere = `
    coalesce(o.order_month, date_format(coalesce(o.delivery_date, o.order_date, o.created_at), '%Y-%m')) = ?
  `;

  const [entryRows, summaryRows, taxRows, invoiceRows, staffRows] = await Promise.all([
    pool.query<FinanceEntryRow[]>(
      `
        select
          o.order_id,
          o.order_code,
          c.customer_code,
          c.customer_name,
          s.full_name,
          o.cargo_name,
          o.delivery_date,
          o.payment_due_date,
          o.collection_status,
          o.invoice_status,
          o.total_packages,
          o.total_weight_kg,
          o.total_volume_m3,
          o.total_cost_vnd,
          o.total_business_cost_vnd,
          o.total_charge_vnd,
          o.paid_amount_vnd,
          o.remaining_amount_vnd,
          o.gross_profit_vnd,
          o.business_profit_vnd,
          coalesce(sum(case when oc.cost_type = 'import_tax' then oc.amount_vnd end), 0) as import_tax_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'vat' then oc.amount_vnd end), 0) as vat_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'china_domestic' then oc.amount_vnd end), 0) as china_domestic_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'vietnam_domestic' then oc.amount_vnd end), 0) as vietnam_domestic_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'three_wheel_fee' then oc.amount_vnd end), 0) as three_wheel_fee_vnd,
          coalesce(sum(case when oc.cost_type = 'customs_fee' then oc.amount_vnd end), 0) as customs_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'sea_freight' then oc.amount_vnd end), 0) as sea_freight_cost_vnd,
          coalesce(sum(case when oc.cost_type = 'other_cost' then oc.amount_vnd end), 0) as other_cost_vnd,
          coalesce(ch.customer_freight_vnd, 0) as customer_freight_vnd,
          coalesce(ch.china_domestic_charge_vnd, 0) as china_domestic_charge_vnd,
          coalesce(ch.import_tax_charge_vnd, 0) as import_tax_charge_vnd,
          coalesce(ch.vat_charge_vnd, 0) as vat_charge_vnd,
          coalesce(ch.surcharge_vnd, 0) as surcharge_vnd,
          coalesce(ch.customs_charge_vnd, 0) as customs_charge_vnd,
          coalesce(ch.sea_freight_charge_vnd, 0) as sea_freight_charge_vnd,
          coalesce(ch.other_revenue_vnd, 0) as other_revenue_vnd,
          coalesce(ch.revenue_discount_vnd, 0) as revenue_discount_vnd
        from orders o
        left join customers c on c.customer_id = o.customer_id
        left join staff s on s.staff_id = o.assigned_staff_id
        left join order_costs oc on oc.order_id = o.order_id
        left join (
          select
            order_id,
            sum(case when charge_type = 'customer_freight' then amount_vnd else 0 end) as customer_freight_vnd,
            sum(case when charge_type = 'china_domestic_charge' then amount_vnd else 0 end) as china_domestic_charge_vnd,
            sum(case when charge_type = 'import_tax_charge' then amount_vnd else 0 end) as import_tax_charge_vnd,
            sum(case when charge_type = 'vat_charge' then amount_vnd else 0 end) as vat_charge_vnd,
            sum(case when charge_type = 'surcharge' then amount_vnd else 0 end) as surcharge_vnd,
            sum(case when charge_type = 'customs_fee_charge' then amount_vnd else 0 end) as customs_charge_vnd,
            sum(case when charge_type = 'sea_freight_charge' then amount_vnd else 0 end) as sea_freight_charge_vnd,
            sum(case when charge_type = 'other_revenue' then amount_vnd else 0 end) as other_revenue_vnd,
            sum(case when charge_type = 'revenue_discount' then amount_vnd else 0 end) as revenue_discount_vnd
          from order_charges
          group by order_id
        ) ch on ch.order_id = o.order_id
        where ${monthWhere}
        group by o.order_id
        order by coalesce(o.delivery_date, o.order_date, o.created_at) desc, o.order_code
        limit 200
      `,
      [selectedMonth],
    ),
    pool.query<SummaryRow[]>(
      `
        select
          count(*) as total_orders,
          coalesce(sum(total_charge_vnd), 0) as total_revenue_vnd,
          coalesce(sum(paid_amount_vnd), 0) as total_collected_vnd,
          coalesce(sum(remaining_amount_vnd), 0) as total_receivable_vnd,
          coalesce(sum(total_cost_vnd), 0) as total_cost_vnd,
          coalesce(sum(total_business_cost_vnd), 0) as total_business_cost_vnd,
          coalesce(sum(gross_profit_vnd), 0) as gross_profit_vnd,
          coalesce(sum(business_profit_vnd), 0) as business_profit_vnd,
          coalesce(sum(import_tax_amount_vnd), 0) as import_tax_vnd,
          coalesce(sum(vat_amount_vnd), 0) as vat_vnd,
          coalesce(sum(case when remaining_amount_vnd > 0 and payment_due_date < curdate() then remaining_amount_vnd else 0 end), 0) as overdue_amount_vnd
        from orders o
        left join tax_records tr on tr.order_id = o.order_id
        where ${monthWhere}
      `,
      [selectedMonth],
    ),
    pool.query<TaxRow[]>(
      `
        select
          coalesce(sum(import_tax_amount), 0) as import_tax_amount,
          coalesce(sum(vat_amount), 0) as vat_amount,
          coalesce(sum(tax_advance_amount), 0) as tax_advance_amount
        from v_tax_monthly
        where tax_month = ?
      `,
      [selectedMonth],
    ),
    pool.query<InvoiceRow[]>(
      `
        select coalesce(sum(invoice_amount), 0) as invoice_amount
        from v_invoice_monthly
        where invoice_month = ? and status in ('issued', 'sent')
      `,
      [selectedMonth],
    ),
    pool.query<StaffRow[]>(
      `
        select
          coalesce(s.full_name, 'Chua gan nhan su') as staff_name,
          count(*) as total_orders,
          coalesce(sum(o.total_charge_vnd), 0) as total_revenue_vnd,
          coalesce(sum(o.remaining_amount_vnd), 0) as total_receivable_vnd,
          coalesce(sum(o.gross_profit_vnd), 0) as gross_profit_vnd
        from orders o
        left join staff s on s.staff_id = o.assigned_staff_id
        where ${monthWhere}
        group by coalesce(s.full_name, 'Chua gan nhan su')
        order by total_revenue_vnd desc
        limit 8
      `,
      [selectedMonth],
    ),
  ]);

  const summaryRow = summaryRows[0][0];
  const taxRow = taxRows[0][0];
  const invoiceRow = invoiceRows[0][0];
  const totalRevenueVnd = toNumber(summaryRow?.total_revenue_vnd);
  const totalCollectedVnd = toNumber(summaryRow?.total_collected_vnd);

  return {
    availableMonths: availableMonths.includes(selectedMonth) ? availableMonths : [selectedMonth, ...availableMonths],
    entries: entryRows[0].map((row) => ({
      orderId: row.order_id,
      orderCode: row.order_code,
      customerCode: row.customer_code,
      customerName: row.customer_name ?? "Chua co khach hang",
      staffName: row.full_name,
      cargoName: row.cargo_name,
      deliveryDate: toDateString(row.delivery_date),
      paymentDueDate: toDateString(row.payment_due_date),
      collectionStatus: row.collection_status,
      invoiceStatus: row.invoice_status,
      packages: toNumber(row.total_packages),
      weightKg: toNumber(row.total_weight_kg),
      volumeM3: toNumber(row.total_volume_m3),
      totalCostVnd: toNumber(row.total_cost_vnd),
      businessCostVnd: toNumber(row.total_business_cost_vnd),
      totalChargeVnd: toNumber(row.total_charge_vnd),
      paidAmountVnd: toNumber(row.paid_amount_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      grossProfitVnd: toNumber(row.gross_profit_vnd),
      businessProfitVnd: toNumber(row.business_profit_vnd),
      importTaxCostVnd: toNumber(row.import_tax_cost_vnd),
      vatCostVnd: toNumber(row.vat_cost_vnd),
      chinaDomesticCostVnd: toNumber(row.china_domestic_cost_vnd),
      vietnamDomesticCostVnd: toNumber(row.vietnam_domestic_cost_vnd),
      threeWheelFeeVnd: toNumber(row.three_wheel_fee_vnd),
      customsCostVnd: toNumber(row.customs_cost_vnd),
      seaFreightCostVnd: toNumber(row.sea_freight_cost_vnd),
      otherCostVnd: toNumber(row.other_cost_vnd),
      customerFreightVnd: toNumber(row.customer_freight_vnd),
      chinaDomesticChargeVnd: toNumber(row.china_domestic_charge_vnd),
      importTaxChargeVnd: toNumber(row.import_tax_charge_vnd),
      vatChargeVnd: toNumber(row.vat_charge_vnd),
      surchargeVnd: toNumber(row.surcharge_vnd),
      customsChargeVnd: toNumber(row.customs_charge_vnd),
      seaFreightChargeVnd: toNumber(row.sea_freight_charge_vnd),
      otherRevenueVnd: toNumber(row.other_revenue_vnd),
      revenueDiscountVnd: toNumber(row.revenue_discount_vnd),
    })),
    staffRows: staffRows[0].map((row) => ({
      staffName: row.staff_name ?? "Chua gan nhan su",
      totalOrders: toNumber(row.total_orders),
      totalRevenueVnd: toNumber(row.total_revenue_vnd),
      totalReceivableVnd: toNumber(row.total_receivable_vnd),
      grossProfitVnd: toNumber(row.gross_profit_vnd),
    })),
    summary: {
      month: selectedMonth,
      totalOrders: toNumber(summaryRow?.total_orders),
      totalRevenueVnd,
      totalCollectedVnd,
      totalReceivableVnd: toNumber(summaryRow?.total_receivable_vnd),
      totalCostVnd: toNumber(summaryRow?.total_cost_vnd),
      totalBusinessCostVnd: toNumber(summaryRow?.total_business_cost_vnd),
      grossProfitVnd: toNumber(summaryRow?.gross_profit_vnd),
      businessProfitVnd: toNumber(summaryRow?.business_profit_vnd),
      importTaxVnd: toNumber(taxRow?.import_tax_amount) || toNumber(summaryRow?.import_tax_vnd),
      vatVnd: toNumber(taxRow?.vat_amount) || toNumber(summaryRow?.vat_vnd),
      taxAdvanceVnd: toNumber(taxRow?.tax_advance_amount),
      invoiceAmountVnd: toNumber(invoiceRow?.invoice_amount),
      overdueAmountVnd: toNumber(summaryRow?.overdue_amount_vnd),
      collectionRatePercent: totalRevenueVnd > 0 ? (totalCollectedVnd / totalRevenueVnd) * 100 : 0,
    },
  };
}
