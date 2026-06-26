import "server-only";

import { createHash } from "node:crypto";

import { format } from "date-fns";
import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import type { UserDepartmentOption, UserRoleOption, UserRow, UsersLookups } from "./data";

const ADMIN_ROLE_CODE = "ADMIN";
const ADMIN_ROLE_NAME = "Toan quyen";
const ADMIN_STAFF_CODE = "ADMIN";
const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@fobtrans.com";
const ADMIN_DEFAULT_PASSWORD = "Admin@123456";

interface IdRow extends RowDataPacket {
  id: string;
}

interface UserQueryRow extends RowDataPacket {
  user_id: string;
  staff_id: string | null;
  role_id: string | null;
  username: string;
  email: string | null;
  is_active: number | boolean;
  last_login_at: Date | string | null;
  created_at: Date | string | null;
  role_code: string | null;
  role_name: string | null;
  staff_name: string | null;
  staff_email: string | null;
  role_title: string | null;
  staff_status: string | null;
  department_id: string | null;
  department_name: string | null;
  phone: string | null;
  note: string | null;
}

interface RoleOptionRow extends RowDataPacket {
  role_id: string;
  role_code: string;
  role_name: string;
}

interface DepartmentOptionRow extends RowDataPacket {
  department_id: string;
  department_code: string | null;
  department_name: string;
}

async function makeUuid() {
  const pool = getDbPool();
  const [rows] = await pool.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

function passwordHash(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function toDate(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatJoinedDate(value: Date | string | null) {
  const date = toDate(value) ?? new Date();
  return format(date, "dd MMM yyyy, h:mm a");
}

function lastActiveMinutes(value: Date | string | null, isActive: number | boolean) {
  if (!isActive) return 90 * 24 * 60;

  const date = toDate(value);
  if (!date) return 0;

  return Math.max(Math.floor((Date.now() - date.getTime()) / 60000), 0);
}

function mapStatus(row: UserQueryRow): UserRow["status"] {
  if (!row.is_active) return "Deactivated";
  if (row.staff_status === "inactive") return "Deactivated";
  return "Active";
}

async function ensureAdminRole() {
  const pool = getDbPool();
  await pool.query(
    `
      insert into roles (role_id, role_code, role_name, description)
      values (uuid(), ?, ?, ?)
      on duplicate key update role_name = values(role_name), description = values(description), updated_at = current_timestamp
    `,
    [ADMIN_ROLE_CODE, ADMIN_ROLE_NAME, "Quyen quan tri toan bo he thong"],
  );

  const [rows] = await pool.query<IdRow[]>("select role_id as id from roles where role_code = ? limit 1", [
    ADMIN_ROLE_CODE,
  ]);
  return rows[0].id;
}

async function ensureAdminStaff() {
  const pool = getDbPool();
  const [existing] = await pool.query<IdRow[]>("select staff_id as id from staff where staff_code = ? limit 1", [
    ADMIN_STAFF_CODE,
  ]);

  if (existing[0]?.id) {
    await pool.query(
      `
        update staff
        set full_name = ?, role_title = ?, email = ?, status = 'active', updated_at = current_timestamp
        where staff_id = ?
      `,
      ["Quan tri vien", ADMIN_ROLE_NAME, ADMIN_EMAIL, existing[0].id],
    );
    return existing[0].id;
  }

  const staffId = await makeUuid();
  await pool.query(
    `
      insert into staff (staff_id, staff_code, full_name, role_title, email, status)
      values (?, ?, ?, ?, ?, 'active')
    `,
    [staffId, ADMIN_STAFF_CODE, "Quan tri vien", ADMIN_ROLE_NAME, ADMIN_EMAIL],
  );

  return staffId;
}

export async function ensureAdminUser() {
  const pool = getDbPool();
  const [existing] = await pool.query<IdRow[]>("select user_id as id from users where username = ? limit 1", [
    ADMIN_USERNAME,
  ]);
  const roleId = await ensureAdminRole();
  const staffId = await ensureAdminStaff();
  const hash = passwordHash(ADMIN_DEFAULT_PASSWORD);

  if (existing[0]?.id) {
    await pool.query(
      `
        update users
        set staff_id = ?, role_id = ?, email = ?, is_active = 1, updated_at = current_timestamp
        where user_id = ?
      `,
      [staffId, roleId, ADMIN_EMAIL, existing[0].id],
    );
    return;
  }

  await pool.query(
    `
      insert into users (user_id, staff_id, role_id, username, password_hash, email, is_active)
      values (uuid(), ?, ?, ?, ?, ?, 1)
    `,
    [staffId, roleId, ADMIN_USERNAME, hash, ADMIN_EMAIL],
  );
}

export async function getUsersLookups(): Promise<UsersLookups> {
  await ensureAdminUser();

  const pool = getDbPool();
  const [roles, departments] = await Promise.all([
    pool.query<RoleOptionRow[]>("select role_id, role_code, role_name from roles order by role_name"),
    pool.query<DepartmentOptionRow[]>(
      "select department_id, department_code, department_name from departments where is_active = 1 order by department_name",
    ),
  ]);

  return {
    roles: roles[0].map((role): UserRoleOption => ({ id: role.role_id, code: role.role_code, name: role.role_name })),
    departments: departments[0].map(
      (department): UserDepartmentOption => ({
        id: department.department_id,
        code: department.department_code,
        name: department.department_name,
      }),
    ),
  };
}

export async function getUsersData(): Promise<UserRow[]> {
  await ensureAdminUser();

  const pool = getDbPool();
  const [rows] = await pool.query<UserQueryRow[]>(
    `
      select
        u.user_id,
        u.staff_id,
        u.role_id,
        u.username,
        u.email,
        u.is_active,
        u.last_login_at,
        u.created_at,
        r.role_code,
        r.role_name,
        s.full_name as staff_name,
        s.email as staff_email,
        s.role_title,
        s.status as staff_status,
        s.department_id,
        s.phone,
        s.note,
        d.department_name
      from users u
      left join roles r on r.role_id = u.role_id
      left join staff s on s.staff_id = u.staff_id
      left join departments d on d.department_id = s.department_id
      order by coalesce(u.updated_at, u.created_at) desc
      limit 500
    `,
  );

  return rows.map((row) => {
    const role = row.role_name ?? row.role_code ?? "Chua gan quyen";
    const team = row.department_name ?? row.role_title ?? "He thong";
    const workspace = [row.department_name ?? "Fobtrans ERP"];

    return {
      id: row.user_id,
      staffId: row.staff_id,
      roleId: row.role_id,
      departmentId: row.department_id,
      username: row.username,
      name: row.staff_name ?? row.username,
      email: row.email ?? row.staff_email ?? `${row.username}@fobtrans.local`,
      role,
      roleCode: row.role_code,
      roleTitle: row.role_title,
      status: mapStatus(row),
      isActive: Boolean(row.is_active),
      staffStatus: row.staff_status,
      team,
      workspace,
      phone: row.phone,
      note: row.note,
      joinedDate: formatJoinedDate(row.created_at),
      lastActive: lastActiveMinutes(row.last_login_at, row.is_active),
    };
  });
}