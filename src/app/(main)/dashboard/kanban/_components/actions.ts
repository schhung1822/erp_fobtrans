"use server";

import { revalidatePath } from "next/cache";

import type { ResultSetHeader } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

import { columnIds } from "./columns";
import type { ColumnId } from "./types";

function isColumnId(value: string): value is ColumnId {
  return columnIds.includes(value as ColumnId);
}

export async function updateOrderKanbanStatus(orderId: string, operationStatus: ColumnId) {
  if (!orderId) throw new Error("Thieu order_id de cap nhat trang thai.");
  if (!isColumnId(operationStatus)) throw new Error("Trạng thái đơn hàng không hợp lệ.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    "update orders set operation_status = ?, updated_at = current_timestamp where order_id = ?",
    [operationStatus, orderId],
  );

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy đơn hàng để cập nhật trạng thái.");
  }

  revalidatePath("/kanban");
  revalidatePath("/dashboard/kanban");
  revalidatePath("/orders");
  revalidatePath("/dashboard/orders");
}
