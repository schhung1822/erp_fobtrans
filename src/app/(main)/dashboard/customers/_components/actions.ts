"use server";

import { revalidatePath } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

import { ensureCustomerExtraColumns } from "./data";

interface IdRow extends RowDataPacket {
  id: string;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function makeUuid() {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

function revalidateCustomers() {
  revalidatePath("/customers");
  revalidatePath("/dashboard/customers");
}

export async function createCustomer(formData: FormData) {
  await ensureCustomerExtraColumns();

  const name = text(formData, "name");
  if (!name) throw new Error("Vui lòng nhập tên khách hàng.");

  const pool = getDbPool();
  const customerId = await makeUuid();
  const customerCode = text(formData, "code") ?? `KH-${Date.now().toString(36).toUpperCase()}`;

  await pool.query(
    `
      insert into customers (customer_id, customer_code, customer_name, phone, tax_code, delivery_address, billing_address, note)
      values (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      customerId,
      customerCode,
      name,
      text(formData, "phone"),
      text(formData, "taxCode"),
      text(formData, "deliveryAddress"),
      text(formData, "billingAddress"),
      text(formData, "note"),
    ],
  );

  revalidateCustomers();
}

export async function updateCustomer(formData: FormData) {
  await ensureCustomerExtraColumns();

  const customerId = text(formData, "customerId");
  const name = text(formData, "name");

  if (!customerId) throw new Error("Thiếu id khách để cập nhật.");
  if (!name) throw new Error("Vui lòng nhập tên khách hàng.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    `
      update customers
      set
        customer_code = ?,
        customer_name = ?,
        phone = ?,
        tax_code = ?,
        delivery_address = ?,
        billing_address = ?,
        note = ?,
        updated_at = current_timestamp
      where customer_id = ?
    `,
    [
      text(formData, "code"),
      name,
      text(formData, "phone"),
      text(formData, "taxCode"),
      text(formData, "deliveryAddress"),
      text(formData, "billingAddress"),
      text(formData, "note"),
      customerId,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy khách hàng để cập nhật.");
  }

  revalidateCustomers();
}

export async function deleteCustomer(formData: FormData) {
  const customerId = text(formData, "customerId");
  if (!customerId) throw new Error("Thieu customer_id de xoa.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>("delete from customers where customer_id = ?", [customerId]);

  if (result.affectedRows === 0) {
    throw new Error("Khong tim thay khach hang de xoa.");
  }

  revalidateCustomers();
}
