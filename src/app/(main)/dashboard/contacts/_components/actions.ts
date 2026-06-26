"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

import { ensureCustomerExtraColumns } from "../../customers/_components/data";
import { sendContactCreatedNotification } from "../../notifications/_components/notification-sender";
import { ensureCustomerContactsTable } from "./data";
import { leadStatuses, type LeadStatus } from "./schema";

interface IdRow extends RowDataPacket {
  id: string;
}

interface CountRow extends RowDataPacket {
  total: number | string | null;
}

interface CustomerIdRow extends RowDataPacket {
  customer_id: string;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "none" || trimmed === "__empty__") return null;
  return trimmed.length ? trimmed : null;
}

function leadStatus(formData: FormData): LeadStatus {
  const value = text(formData, "leadStatus");
  return leadStatuses.includes(value as LeadStatus) ? (value as LeadStatus) : "new";
}

async function makeUuid() {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

async function makeCustomerCode() {
  const pool = getDbPool();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `KH-${Date.now().toString(36).toUpperCase()}${attempt ? `-${attempt}` : ""}`;
    const [rows] = await pool.query<CountRow[]>(
      "select count(*) as total from customers where customer_id = ? or customer_code = ?",
      [code, code],
    );

    if (Number(rows[0]?.total ?? 0) === 0) return code;
  }

  return `KH-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function normalizedPhoneSql(columnName: string) {
  return `replace(replace(replace(replace(replace(replace(coalesce(${columnName}, ''), ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '')`;
}

function normalizePhone(value: string | null) {
  return value?.replace(/[\s.\-()+]/g, "") ?? "";
}

async function findCustomerByPhone(phone: string | null) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return null;

  const pool = getDbPool();
  const [rows] = await pool.query<CustomerIdRow[]>(
    `
      select customer_id
      from customers
      where ${normalizedPhoneSql("phone")} = ?
      order by updated_at desc, created_at desc
      limit 1
    `,
    [normalizedPhone],
  );

  return rows[0]?.customer_id ?? null;
}

async function ensureCustomerForContact(formData: FormData, contactName: string) {
  await ensureCustomerExtraColumns();

  const phone = text(formData, "phone");
  const existingCustomerId = await findCustomerByPhone(phone);
  if (existingCustomerId) return existingCustomerId;

  const pool = getDbPool();
  const customerCode = await makeCustomerCode();

  await pool.query(
    `
      insert into customers (customer_id, customer_code, customer_name, phone, note)
      values (?, ?, ?, ?, ?)
    `,
    [customerCode, customerCode, contactName, phone, text(formData, "note")],
  );

  return customerCode;
}

function revalidateContacts() {
  revalidatePath("/contacts");
  revalidatePath("/dashboard/contacts");
  revalidatePath("/customers");
  revalidatePath("/dashboard/customers");
}

export async function createContact(formData: FormData) {
  await ensureCustomerContactsTable();

  const name = text(formData, "name");
  if (!name) throw new Error("Vui lòng nhập tên liên hệ");

  const pool = getDbPool();
  const contactId = await makeUuid();
  const customerId = await ensureCustomerForContact(formData, name);

  await pool.query(
    `
      insert into customer_contacts (contact_id, customer_id, contact_name, title, phone, email, lead_status, assigned_staff_id, note, is_primary)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `,
    [
      contactId,
      customerId,
      name,
      text(formData, "title"),
      text(formData, "phone"),
      text(formData, "email"),
      leadStatus(formData),
      text(formData, "assignedStaffId"),
      text(formData, "note"),
    ],
  );

  await sendContactCreatedNotification({
    contact_name: name,
    customer_name: name,
    title: text(formData, "title"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    note: text(formData, "note"),
  }).catch((error) => {
    console.error("Failed to send contact notification", error);
  });

  revalidateContacts();
}

export async function updateContact(formData: FormData) {
  await ensureCustomerContactsTable();

  const contactId = text(formData, "contactId");
  const name = text(formData, "name");

  if (!contactId) throw new Error("Thieu contact_id de cap nhat.");
  if (!name) throw new Error("Vui long nhap ten lien he.");

  const pool = getDbPool();
  const customerId = await ensureCustomerForContact(formData, name);
  const [result] = await pool.query<ResultSetHeader>(
    `
      update customer_contacts
      set
        customer_id = ?,
        contact_name = ?,
        title = ?,
        phone = ?,
        email = ?,
        lead_status = ?,
        assigned_staff_id = ?,
        note = ?,
        updated_at = current_timestamp
      where contact_id = ?
    `,
    [
      customerId,
      name,
      text(formData, "title"),
      text(formData, "phone"),
      text(formData, "email"),
      leadStatus(formData),
      text(formData, "assignedStaffId"),
      text(formData, "note"),
      contactId,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Khong tim thay lien he de cap nhat.");
  }

  revalidateContacts();
}

export async function updateLeadStatus(formData: FormData) {
  await ensureCustomerContactsTable();

  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Thieu contact_id de cap nhat trang thai.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    "update customer_contacts set lead_status = ?, updated_at = current_timestamp where contact_id = ?",
    [leadStatus(formData), contactId],
  );

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy liên hệ để cập nhật trạng thái.");
  }

  revalidateContacts();
}

export async function updateContactStaff(formData: FormData) {
  await ensureCustomerContactsTable();

  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Thieu contact_id de cap nhat nhan su tiep nhan.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>(
    "update customer_contacts set assigned_staff_id = ?, updated_at = current_timestamp where contact_id = ?",
    [text(formData, "assignedStaffId"), contactId],
  );

  if (result.affectedRows === 0) {
    throw new Error("Khong tim thay lead de cap nhat nhan su tiep nhan.");
  }

  revalidateContacts();
}

export async function deleteContact(formData: FormData) {
  const contactId = text(formData, "contactId");
  if (!contactId) throw new Error("Thieu contact_id de xoa.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>("delete from customer_contacts where contact_id = ?", [contactId]);

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy liên hệ để xóa.");
  }

  revalidateContacts();
}
