"use server";

import { revalidatePath } from "next/cache";

import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

import { createHash } from "node:crypto";

interface IdRow extends RowDataPacket {
  id: string;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "none") return null;
  return trimmed.length ? trimmed : null;
}

function active(formData: FormData) {
  return formData.get("isActive") === "on";
}

function passwordHash(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function makeUuid() {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

function revalidateUsers() {
  revalidatePath("/users");
  revalidatePath("/dashboard/users");
}

async function usernameExists(username: string, exceptUserId?: string | null) {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>(
    exceptUserId
      ? "select user_id as id from users where username = ? and user_id <> ? limit 1"
      : "select user_id as id from users where username = ? limit 1",
    exceptUserId ? [username, exceptUserId] : [username],
  );
  return Boolean(rows[0]);
}

export async function createUser(formData: FormData) {
  const username = text(formData, "username");
  const name = text(formData, "name");
  const email = text(formData, "email");

  if (!username) throw new Error("Vui lòng nhập tên đăng nhập.");
  if (!name) throw new Error("Vui lòng nhập tên nhân sự.");
  if (await usernameExists(username)) throw new Error("Tên đăng nhập đã tồn tại.");

  const pool = getDbPool();
  const staffId = await makeUuid();
  const roleId = text(formData, "roleId");
  const departmentId = text(formData, "departmentId");
  const isActive = active(formData);
  const password = text(formData, "password");

  await pool.query(
    `
      insert into staff (staff_id, staff_code, full_name, department_id, role_title, phone, email, status, note)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      staffId,
      text(formData, "staffCode") ?? username.toUpperCase(),
      name,
      departmentId,
      text(formData, "roleTitle"),
      text(formData, "phone"),
      email,
      isActive ? "active" : "inactive",
      text(formData, "note"),
    ],
  );

  await pool.query(
    `
      insert into users (user_id, staff_id, role_id, username, password_hash, email, is_active)
      values (uuid(), ?, ?, ?, ?, ?, ?)
    `,
    [staffId, roleId, username, password ? passwordHash(password) : null, email, isActive ? 1 : 0],
  );

  revalidateUsers();
}

export async function updateUser(formData: FormData) {
  const userId = text(formData, "userId");
  const staffId = text(formData, "staffId");
  const username = text(formData, "username");
  const name = text(formData, "name");
  const email = text(formData, "email");

  if (!userId) throw new Error("Thiếu user_id để cập nhật.");
  if (!staffId) throw new Error("Thiếu staff_id để cập nhật.");
  if (!username) throw new Error("Vui lòng nhập tên đăng nhập.");
  if (!name) throw new Error("Vui lòng nhập tên nhân sự.");
  if (await usernameExists(username, userId)) throw new Error("Tên đăng nhập đã tồn tại.");

  const pool = getDbPool();
  const isActive = active(formData);
  const password = text(formData, "password");

  await pool.query(
    `
      update staff
      set
        full_name = ?,
        department_id = ?,
        role_title = ?,
        phone = ?,
        email = ?,
        status = ?,
        note = ?,
        updated_at = current_timestamp
      where staff_id = ?
    `,
    [
      name,
      text(formData, "departmentId"),
      text(formData, "roleTitle"),
      text(formData, "phone"),
      email,
      isActive ? "active" : "inactive",
      text(formData, "note"),
      staffId,
    ],
  );

  const [result] = await pool.query<ResultSetHeader>(
    `
      update users
      set
        role_id = ?,
        username = ?,
        email = ?,
        is_active = ?,
        password_hash = coalesce(?, password_hash),
        updated_at = current_timestamp
      where user_id = ?
    `,
    [text(formData, "roleId"), username, email, isActive ? 1 : 0, password ? passwordHash(password) : null, userId],
  );

  if (result.affectedRows === 0) throw new Error("Không tìm thấy người dùng để cập nhật.");

  revalidateUsers();
}

export async function deleteUser(formData: FormData) {
  const userId = text(formData, "userId");
  const staffId = text(formData, "staffId");

  if (!userId) throw new Error("Thiếu user_id để xóa.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>("delete from users where user_id = ?", [userId]);

  if (result.affectedRows === 0) throw new Error("Không tìm thấy người dùng để xóa.");

  if (staffId) {
    await pool.query("delete from staff where staff_id = ?", [staffId]).catch(async () => {
      await pool.query("update staff set status = 'inactive', updated_at = current_timestamp where staff_id = ?", [
        staffId,
      ]);
    });
  }

  revalidateUsers();
}
