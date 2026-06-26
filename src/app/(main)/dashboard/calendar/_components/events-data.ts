import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

export type OrderCalendarEventKind = "delivery" | "payment";

export interface OrderCalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  color: string;
  extendedProps: {
    kind: OrderCalendarEventKind;
    orderId: string;
    orderCode: string;
    customerName: string;
    amountVnd: number;
  };
}

interface OrderScheduleRow extends RowDataPacket {
  order_id: string;
  order_code: string;
  customer_name: string | null;
  delivery_date: Date | string | null;
  payment_due_date: Date | string | null;
  remaining_amount_vnd: number | string | null;
  total_charge_vnd: number | string | null;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function toDateOnly(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

export async function getOrderCalendarEvents(): Promise<OrderCalendarEvent[]> {
  const pool = getDbPool();
  const [rows] = await pool.query<OrderScheduleRow[]>(
    `
      select
        o.order_id,
        o.order_code,
        c.customer_name,
        o.delivery_date,
        o.payment_due_date,
        o.remaining_amount_vnd,
        o.total_charge_vnd
      from orders o
      left join customers c on c.customer_id = o.customer_id
      where o.delivery_date is not null or o.payment_due_date is not null
      order by coalesce(o.delivery_date, o.payment_due_date, o.order_date, date(o.created_at)) desc
      limit 1000
    `,
  );

  return rows.flatMap((row) => {
    const customerName = row.customer_name ?? "Chua co khach hang";
    const remainingAmount = toNumber(row.remaining_amount_vnd);
    const totalCharge = toNumber(row.total_charge_vnd);
    const amountVnd = remainingAmount > 0 ? remainingAmount : totalCharge;
    const deliveryDate = toDateOnly(row.delivery_date);
    const paymentDueDate = toDateOnly(row.payment_due_date);
    const events: OrderCalendarEvent[] = [];

    if (deliveryDate) {
      events.push({
        id: `${row.order_id}-delivery`,
        title: `Giao ${row.order_code} - ${customerName}`,
        start: deliveryDate,
        allDay: true,
        color: "#2563eb",
        extendedProps: {
          kind: "delivery",
          orderId: row.order_id,
          orderCode: row.order_code,
          customerName,
          amountVnd: totalCharge,
        },
      });
    }

    if (paymentDueDate) {
      events.push({
        id: `${row.order_id}-payment`,
        title: `Thu tien ${row.order_code} - ${customerName}`,
        start: paymentDueDate,
        allDay: true,
        color: "#16a34a",
        extendedProps: {
          kind: "payment",
          orderId: row.order_id,
          orderCode: row.order_code,
          customerName,
          amountVnd,
        },
      });
    }

    return events;
  });
}
