import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import type { OperationWarehouseRow } from "./schema";

interface WarehouseQueryRow extends RowDataPacket {
  warehouse_id: string;
  warehouse_code: string | null;
  warehouse_name: string | null;
  address: string | null;
  is_active: number | boolean | null;
  order_count: number | string | null;
  active_order_count: number | string | null;
  delivered_order_count: number | string | null;
  total_packages: number | string | null;
  total_weight_kg: number | string | null;
  total_volume_m3: number | string | null;
  last_order_date: Date | string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

function toNumber(value: number | string | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function toDateString(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

export async function getOperationsData(): Promise<OperationWarehouseRow[]> {
  const pool = getDbPool();
  const [rows] = await pool.query<WarehouseQueryRow[]>(
    `
      select
        w.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        w.address,
        w.is_active,
        w.created_at,
        w.updated_at,
        count(o.order_id) as order_count,
        sum(case when o.order_id is not null and o.operation_status not in ('delivered', 'cancelled') then 1 else 0 end) as active_order_count,
        sum(case when o.operation_status = 'delivered' then 1 else 0 end) as delivered_order_count,
        coalesce(sum(o.total_packages), 0) as total_packages,
        coalesce(sum(o.total_weight_kg), 0) as total_weight_kg,
        coalesce(sum(o.total_volume_m3), 0) as total_volume_m3,
        max(coalesce(o.delivery_date, o.order_date, date(o.created_at))) as last_order_date
      from warehouses w
      left join orders o on o.warehouse_id = w.warehouse_id
      group by
        w.warehouse_id,
        w.warehouse_code,
        w.warehouse_name,
        w.address,
        w.is_active,
        w.created_at,
        w.updated_at
      order by coalesce(max(o.created_at), w.updated_at, w.created_at) desc
      limit 500
    `,
  );

  return rows.map((row) => ({
    id: row.warehouse_id,
    code: row.warehouse_code,
    name: row.warehouse_name ?? "Chua co ten kho",
    address: row.address,
    isActive: toNumber(row.is_active) === 1,
    orderCount: toNumber(row.order_count),
    activeOrderCount: toNumber(row.active_order_count),
    deliveredOrderCount: toNumber(row.delivered_order_count),
    totalPackages: toNumber(row.total_packages),
    totalWeightKg: toNumber(row.total_weight_kg),
    totalVolumeM3: toNumber(row.total_volume_m3),
    lastOrderDate: toDateString(row.last_order_date),
    createdAt: toDateString(row.created_at),
    updatedAt: toDateString(row.updated_at),
  }));
}
