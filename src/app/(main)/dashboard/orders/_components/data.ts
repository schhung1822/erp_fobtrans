import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import type { OrderLookups, OrderRow, OrdersSummary } from "./schema";

export interface OrdersDateRange {
  from: string;
  to: string;
}

interface OrderQueryRow extends RowDataPacket {
  order_id: string;
  order_code: string;
  customer_id: string;
  customer_code: string | null;
  customer_name: string | null;
  service_type_id: string | null;
  service_name: string | null;
  assigned_staff_id: string | null;
  full_name: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  order_date: Date | string | null;
  created_at: Date | string | null;
  delivery_date: Date | string | null;
  payment_due_date: Date | string | null;
  delivery_address: string | null;
  sender_name: string | null;
  sender_phone: string | null;
  sender_address: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_address: string | null;
  route_name: string | null;
  container_code: string | null;
  tracking_code: string | null;
  cargo_name: string | null;
  cargo_value_vnd: number | string | null;
  operation_status: OrderRow["operationStatus"];
  customs_status: OrderRow["customsStatus"];
  collection_status: OrderRow["collectionStatus"];
  invoice_status: OrderRow["invoiceStatus"];
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  total_packages: number | null;
  total_cost_vnd: number | string | null;
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  gross_profit_vnd: number | string | null;
  note: string | null;
}

interface SummaryQueryRow extends RowDataPacket {
  total_orders: number;
  total_revenue_vnd: number | string | null;
  total_receivable_vnd: number | string | null;
  total_profit_vnd: number | string | null;
}

interface CountQueryRow extends RowDataPacket {
  total: number;
}

interface LookupQueryRow extends RowDataPacket {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  address: string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalDateParts(date: Date) {
  return {
    year: date.getFullYear(),
    month: padDatePart(date.getMonth() + 1),
    day: padDatePart(date.getDate()),
    hour: padDatePart(date.getHours()),
    minute: padDatePart(date.getMinutes()),
    second: padDatePart(date.getSeconds()),
  };
}

function toSqlDateString(value: Date | string | null) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  if (Number.isNaN(value.getTime())) return null;

  const parts = toLocalDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function toSqlDateTimeString(value: Date | string | null) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
    if (match) return `${match[1]}T${match[2]}`;

    return toSqlDateString(value);
  }

  if (Number.isNaN(value.getTime())) return null;

  const parts = toLocalDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

async function tableExists(tableName: string) {
  const pool = getDbPool();
  const [rows] = await pool.query<CountQueryRow[]>(
    "select count(*) as total from information_schema.tables where table_schema = database() and table_name = ?",
    [tableName],
  );

  return toNumber(rows[0]?.total) > 0;
}

export async function ensureOrderContactColumns() {
  const columns = [
    ["sender_name", "varchar(255) null after delivery_address"],
    ["sender_phone", "varchar(50) null after sender_name"],
    ["sender_address", "text null after sender_phone"],
    ["receiver_name", "varchar(255) null after sender_address"],
    ["receiver_phone", "varchar(50) null after receiver_name"],
    ["receiver_address", "text null after receiver_phone"],
    ["cargo_name", "varchar(255) null after tracking_code"],
    ["cargo_value_vnd", "decimal(18,2) not null default 0 after cargo_name"],
  ] as const;
  const pool = getDbPool();

  for (const [name, definition] of columns) {
    const [rows] = await pool.query<CountQueryRow[]>(
      "select count(*) as total from information_schema.columns where table_schema = database() and table_name = 'orders' and column_name = ?",
      [name],
    );

    if (toNumber(rows[0]?.total) === 0) {
      await pool.query(`alter table orders add column ${name} ${definition}`);
    }
  }
}
async function getPendingImportRows() {
  if (!(await tableExists("excel_import_rows"))) return 0;

  const pool = getDbPool();
  const [rows] = await pool.query<CountQueryRow[]>(
    "select count(*) as total from excel_import_rows where mapped_order_id is null and import_status in ('pending', 'mapped')",
  );

  return toNumber(rows[0]?.total);
}

export async function getOrderLookups(): Promise<OrderLookups> {
  const pool = getDbPool();
  const [customers, staff, warehouses, serviceTypes] = await Promise.all([
    pool.query<LookupQueryRow[]>(
      "select customer_id as id, customer_code as code, customer_name as name, phone, coalesce(delivery_address, billing_address) as address from customers order by customer_name limit 500",
    ),
    pool.query<LookupQueryRow[]>(
      "select staff_id as id, staff_code as code, full_name as name, phone, null as address from staff where status = 'active' order by full_name limit 500",
    ),
    pool.query<LookupQueryRow[]>(
      "select warehouse_id as id, warehouse_code as code, warehouse_name as name, null as phone, address from warehouses where is_active = 1 order by warehouse_name",
    ),
    pool.query<LookupQueryRow[]>(
      "select service_type_id as id, service_code as code, service_name as name, null as phone, null as address from service_types where is_active = 1 order by service_name",
    ),
  ]);

  return {
    customers: customers[0],
    staff: staff[0],
    warehouses: warehouses[0],
    serviceTypes: serviceTypes[0],
  };
}

export async function getOrdersData(
  dateRange: OrdersDateRange,
): Promise<{ orders: OrderRow[]; summary: OrdersSummary; lookups: OrderLookups }> {
  await ensureOrderContactColumns();
  const pool = getDbPool();
  const rangeParams = [dateRange.from, dateRange.to];
  const [ordersRows] = await pool.query<OrderQueryRow[]>(
    `
      select
        o.order_id,
        o.order_code,
        o.customer_id,
        c.customer_code,
        c.customer_name,
        o.service_type_id,
        st.service_name,
        o.assigned_staff_id,
        s.full_name,
        o.warehouse_id,
        w.warehouse_name,
        o.order_date,
        o.created_at,
        o.delivery_date,
        o.payment_due_date,
        o.delivery_address,
        o.sender_name,
        o.sender_phone,
        o.sender_address,
        o.receiver_name,
        o.receiver_phone,
        o.receiver_address,
        o.route_name,
        o.container_code,
        o.tracking_code,
        o.cargo_name,
        o.cargo_value_vnd,
        o.operation_status,
        o.customs_status,
        o.collection_status,
        o.invoice_status,
        o.total_weight_kg,
        o.total_volume_m3,
        o.total_packages,
        o.total_cost_vnd,
        o.total_charge_vnd,
        o.paid_amount_vnd,
        o.remaining_amount_vnd,
        o.gross_profit_vnd,
        o.note
      from orders o
      left join customers c on c.customer_id = o.customer_id
      left join staff s on s.staff_id = o.assigned_staff_id
      left join warehouses w on w.warehouse_id = o.warehouse_id
      left join service_types st on st.service_type_id = o.service_type_id
      where o.created_at >= ? and o.created_at < ?
      order by coalesce(o.delivery_date, o.order_date, date(o.created_at)) desc, o.created_at desc
      limit 1000
    `,
    rangeParams,
  );

  const [summaryRows, pendingImportRows, lookups] = await Promise.all([
    pool.query<SummaryQueryRow[]>(
      `
        select
          count(*) as total_orders,
          coalesce(sum(total_charge_vnd), 0) as total_revenue_vnd,
          coalesce(sum(remaining_amount_vnd), 0) as total_receivable_vnd,
          coalesce(sum(gross_profit_vnd), 0) as total_profit_vnd
        from orders
        where created_at >= ? and created_at < ?
      `,
      rangeParams,
    ),
    getPendingImportRows(),
    getOrderLookups(),
  ]);

  const summaryRow = summaryRows[0][0];

  return {
    orders: ordersRows.map((row) => ({
      id: row.order_id,
      code: row.order_code,
      customerId: row.customer_id,
      customerCode: row.customer_code,
      customerName: row.customer_name ?? "Chua co khach hang",
      serviceTypeId: row.service_type_id,
      serviceName: row.service_name,
      assignedStaffId: row.assigned_staff_id,
      staffName: row.full_name,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      orderDate: toSqlDateString(row.order_date),
      createdAt: toSqlDateTimeString(row.created_at),
      deliveryDate: toSqlDateString(row.delivery_date),
      paymentDueDate: toSqlDateString(row.payment_due_date),
      deliveryAddress: row.delivery_address,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderAddress: row.sender_address,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverAddress: row.receiver_address,
      routeName: row.route_name,
      containerCode: row.container_code,
      trackingCode: row.tracking_code,
      cargoName: row.cargo_name,
      cargoValueVnd: toNumber(row.cargo_value_vnd),
      operationStatus: row.operation_status,
      customsStatus: row.customs_status,
      collectionStatus: row.collection_status,
      invoiceStatus: row.invoice_status,
      totalWeightKg: toNumber(row.total_weight_kg),
      totalVolumeM3: toNumber(row.total_volume_m3),
      totalPackages: toNumber(row.total_packages),
      totalCostVnd: toNumber(row.total_cost_vnd),
      totalChargeVnd: toNumber(row.total_charge_vnd),
      paidAmountVnd: toNumber(row.paid_amount_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      grossProfitVnd: toNumber(row.gross_profit_vnd),
      note: row.note,
    })),
    summary: {
      totalOrders: toNumber(summaryRow?.total_orders),
      pendingImportRows,
      totalRevenueVnd: toNumber(summaryRow?.total_revenue_vnd),
      totalReceivableVnd: toNumber(summaryRow?.total_receivable_vnd),
      totalProfitVnd: toNumber(summaryRow?.total_profit_vnd),
    },
    lookups,
  };
}
