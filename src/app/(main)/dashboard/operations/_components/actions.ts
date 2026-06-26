"use server";

import { revalidatePath } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

interface IdRow extends RowDataPacket {
  id: string;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function booleanValue(formData: FormData, key: string) {
  return text(formData, key) === "1" ? 1 : 0;
}

async function makeUuid() {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

function revalidateOperations() {
  revalidatePath("/operations");
  revalidatePath("/dashboard/operations");
}

export async function createWarehouse(formData: FormData) {
  const name = text(formData, "name");
  if (!name) throw new Error("Vui long nhap ten kho.");

  const pool = getDbPool();
  const warehouseId = await makeUuid();
  const warehouseCode = text(formData, "code") ?? `KHO-${Date.now().toString(36).toUpperCase()}`;

  await pool.query(
    `
      insert into warehouses (warehouse_id, warehouse_code, warehouse_name, address, is_active)
      values (?, ?, ?, ?, ?)
    `,
    [warehouseId, warehouseCode, name, text(formData, "address"), booleanValue(formData, "isActive")],
  );

  revalidateOperations();
}

export async function updateWarehouse(formData: FormData) {
  const warehouseId = text(formData, "warehouseId");
  const name = text(formData, "name");

  if (!warehouseId) throw new Error("Thieu warehouse_id de cap nhat.");
  if (!name) throw new Error("Vui long nhap ten kho.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      update warehouses
      set
        warehouse_code = ?,
        warehouse_name = ?,
        address = ?,
        is_active = ?,
        updated_at = current_timestamp
      where warehouse_id = ?
    `,
    [text(formData, "code"), name, text(formData, "address"), booleanValue(formData, "isActive"), warehouseId],
  );

  if (result.affectedRows === 0) {
    throw new Error("Khong tim thay kho de cap nhat.");
  }

  revalidateOperations();
}

export async function deleteWarehouse(formData: FormData) {
  const warehouseId = text(formData, "warehouseId");
  if (!warehouseId) throw new Error("Thieu warehouse_id de xoa.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>("delete from warehouses where warehouse_id = ?", [warehouseId]);

  if (result.affectedRows === 0) {
    throw new Error("Khong tim thay kho de xoa.");
  }

  revalidateOperations();
}
