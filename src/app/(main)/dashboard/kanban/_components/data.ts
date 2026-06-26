import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import { columnIds } from "./columns";
import type { BoardState, CollectionStatus, ColumnId, CustomsStatus, InvoiceStatus, Task, TaskPriority } from "./types";

export interface KanbanDateRange {
  from: string;
  to: string;
}

interface OrderKanbanRow extends RowDataPacket {
  order_id: string;
  order_code: string;
  customer_code: string | null;
  customer_name: string | null;
  operation_status: ColumnId;
  customs_status: CustomsStatus;
  collection_status: CollectionStatus;
  invoice_status: InvoiceStatus;
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
  total_packages: number | string | null;
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  note: string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toSqlDateString(value: Date | string | null) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  if (Number.isNaN(value.getTime())) return null;

  return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
}

function formatDate(value: Date | string | null) {
  const dateString = toSqlDateString(value);
  if (!dateString) return "Chua co lich";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function getPriority(row: OrderKanbanRow): TaskPriority {
  if (row.operation_status === "problem" || toNumber(row.remaining_amount_vnd) > 0) return "High";
  if (row.operation_status === "in_transit" || row.operation_status === "customs_processing") return "Medium";
  return "Low";
}

function createEmptyBoard(): BoardState {
  return columnIds.reduce((board, columnId) => {
    board[columnId] = [];
    return board;
  }, {} as BoardState);
}

export async function getOrdersKanbanBoard(dateRange: KanbanDateRange): Promise<BoardState> {
  const pool = getDbPool();
  const [rows] = await pool.query<OrderKanbanRow[]>(
    `
      select
        o.order_id,
        o.order_code,
        c.customer_code,
        c.customer_name,
        o.operation_status,
        o.customs_status,
        o.collection_status,
        o.invoice_status,
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
        o.total_packages,
        o.total_weight_kg,
        o.total_volume_m3,
        o.total_charge_vnd,
        o.paid_amount_vnd,
        o.remaining_amount_vnd,
        o.note
      from orders o
      left join customers c on c.customer_id = o.customer_id
      where o.created_at >= ? and o.created_at < ?
      order by coalesce(o.delivery_date, o.order_date, date(o.created_at)) desc, o.created_at desc
      limit 500
    `,
    [dateRange.from, dateRange.to],
  );

  const board = createEmptyBoard();

  for (const row of rows) {
    const status = columnIds.includes(row.operation_status) ? row.operation_status : "new";
    const task: Task = {
      id: row.order_id,
      title: row.order_code,
      description: row.note ?? row.cargo_name ?? "Chua co mo ta hang hoa",
      priority: getPriority(row),
      dueDate: formatDate(row.delivery_date ?? row.payment_due_date),
      customerName: row.customer_name ?? "Chua co khach hang",
      customerCode: row.customer_code,
      senderName: row.sender_name,
      senderPhone: row.sender_phone,
      senderAddress: row.sender_address,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      receiverAddress: row.receiver_address,
      deliveryAddress: row.delivery_address,
      orderDate: toSqlDateString(row.order_date ?? row.created_at),
      deliveryDate: toSqlDateString(row.delivery_date),
      paymentDueDate: toSqlDateString(row.payment_due_date),
      routeName: row.route_name,
      containerCode: row.container_code,
      trackingCode: row.tracking_code,
      cargoName: row.cargo_name,
      operationStatus: status,
      customsStatus: row.customs_status ?? "not_started",
      collectionStatus: row.collection_status ?? "not_collected",
      invoiceStatus: row.invoice_status ?? "not_issued",
      totalChargeVnd: toNumber(row.total_charge_vnd),
      paidAmountVnd: toNumber(row.paid_amount_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      totalPackages: toNumber(row.total_packages),
      totalWeightKg: toNumber(row.total_weight_kg),
      totalVolumeM3: toNumber(row.total_volume_m3),
      note: row.note,
    };

    board[status].push(task);
  }

  return board;
}
