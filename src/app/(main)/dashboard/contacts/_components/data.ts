import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import {
  leadStatuses,
  type ContactCustomerOption,
  type ContactOrderStats,
  type ContactRow,
  type ContactsSummary,
  type LeadStatus,
} from "./schema";

interface ContactQueryRow extends RowDataPacket {
  contact_id: string;
  customer_id: string | null;
  customer_code: string | null;
  customer_name: string | null;
  assigned_staff_id: string | null;
  staff_code: string | null;
  staff_name: string | null;
  contact_name: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  lead_status: LeadStatus | string | null;
  note: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

interface SummaryQueryRow extends RowDataPacket {
  total_contacts: number | string | null;
  linked_contacts: number | string | null;
  contacts_with_phone: number | string | null;
}

interface CustomerOptionQueryRow extends RowDataPacket {
  customer_id: string;
  customer_code: string | null;
  customer_name: string | null;
  phone: string | null;
}

interface CountQueryRow extends RowDataPacket {
  total: number | string | null;
}

interface OrderStatsQueryRow extends RowDataPacket {
  normalized_phone: string;
  order_count: number | string | null;
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  remaining_amount_vnd: number | string | null;
  last_order_at: Date | string | null;
}

const emptyOrderStats: ContactOrderStats = {
  orderCount: 0,
  totalChargeVnd: 0,
  paidAmountVnd: 0,
  remainingAmountVnd: 0,
  lastOrderAt: null,
};

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

function toDateString(value: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizePhone(value: string | null | undefined) {
  return value?.replace(/[\s.\-()+]/g, "") ?? "";
}

function normalizeLeadStatus(value: string | null | undefined): LeadStatus {
  return leadStatuses.includes(value as LeadStatus) ? (value as LeadStatus) : "new";
}

export async function ensureCustomerContactsTable() {
  const pool = getDbPool();
  await pool.query(`
    create table if not exists customer_contacts (
      contact_id char(36) not null primary key,
      customer_id char(36) null,
      contact_name varchar(255) not null,
      title varchar(100) null,
      phone varchar(50) null,
      email varchar(255) null,
      zalo varchar(50) null,
      lead_status varchar(32) not null default 'new',
      assigned_staff_id char(36) null,
      note text null,
      is_primary tinyint(1) not null default 0,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp,
      index idx_customer_contacts_customer_id (customer_id),
      index idx_customer_contacts_phone (phone),
      index idx_customer_contacts_email (email),
      index idx_customer_contacts_lead_status (lead_status),
      index idx_customer_contacts_assigned_staff_id (assigned_staff_id)
    )
  `);

  const columns = [
    ["customer_id", "char(36) null after contact_id"],
    ["contact_name", "varchar(255) not null after customer_id"],
    ["title", "varchar(100) null after contact_name"],
    ["phone", "varchar(50) null after title"],
    ["email", "varchar(255) null after phone"],
    ["zalo", "varchar(50) null after email"],
    ["lead_status", "varchar(32) not null default 'new' after zalo"],
    ["assigned_staff_id", "char(36) null after lead_status"],
    ["note", "text null after assigned_staff_id"],
    ["is_primary", "tinyint(1) not null default 0 after note"],
    ["created_at", "timestamp not null default current_timestamp after is_primary"],
    ["updated_at", "timestamp not null default current_timestamp on update current_timestamp after created_at"],
  ] as const;

  for (const [name, definition] of columns) {
    const [rows] = await pool.query<CountQueryRow[]>(
      "select count(*) as total from information_schema.columns where table_schema = database() and table_name = 'customer_contacts' and column_name = ?",
      [name],
    );

    if (toNumber(rows[0]?.total) === 0) {
      await pool.query(`alter table customer_contacts add column ${name} ${definition}`);
    }
  }
}

async function getOrderStatsByPhone(phones: string[]) {
  const normalizedPhones = Array.from(new Set(phones.map(normalizePhone).filter(Boolean)));
  const stats = new Map<string, ContactOrderStats>();

  if (normalizedPhones.length === 0) return stats;

  const pool = getDbPool();
  const placeholders = normalizedPhones.map(() => "?").join(", ");
  const [rows] = await pool.query<OrderStatsQueryRow[]>(
    `
      select
        normalized_phone,
        count(distinct order_id) as order_count,
        coalesce(sum(total_charge_vnd), 0) as total_charge_vnd,
        coalesce(sum(paid_amount_vnd), 0) as paid_amount_vnd,
        coalesce(sum(remaining_amount_vnd), 0) as remaining_amount_vnd,
        max(coalesce(created_at, order_date)) as last_order_at
      from (
        select
          order_id,
          replace(replace(replace(replace(replace(coalesce(sender_phone, ''), ' ', ''), '-', ''), '.', ''), '(', ''), ')', '') as normalized_phone,
          total_charge_vnd,
          paid_amount_vnd,
          remaining_amount_vnd,
          created_at,
          order_date
        from orders
        where sender_phone is not null and sender_phone <> ''
        union all
        select
          order_id,
          replace(replace(replace(replace(replace(coalesce(receiver_phone, ''), ' ', ''), '-', ''), '.', ''), '(', ''), ')', '') as normalized_phone,
          total_charge_vnd,
          paid_amount_vnd,
          remaining_amount_vnd,
          created_at,
          order_date
        from orders
        where receiver_phone is not null and receiver_phone <> ''
      ) phone_orders
      where normalized_phone in (${placeholders})
      group by normalized_phone
    `,
    normalizedPhones,
  );

  for (const row of rows) {
    stats.set(row.normalized_phone, {
      orderCount: toNumber(row.order_count),
      totalChargeVnd: toNumber(row.total_charge_vnd),
      paidAmountVnd: toNumber(row.paid_amount_vnd),
      remainingAmountVnd: toNumber(row.remaining_amount_vnd),
      lastOrderAt: toDateString(row.last_order_at),
    });
  }

  return stats;
}

export async function getContactsData(): Promise<{
  contacts: ContactRow[];
  customers: ContactCustomerOption[];
  summary: ContactsSummary;
}> {
  await ensureCustomerContactsTable();

  const pool = getDbPool();
  const [contactRows, customerRows, summaryRows] = await Promise.all([
    pool.query<ContactQueryRow[]>(
      `
        select
          cc.contact_id,
          cc.customer_id,
          c.customer_code,
          c.customer_name,
          cc.assigned_staff_id,
          s.staff_code,
          s.full_name as staff_name,
          cc.contact_name,
          cc.title,
          cc.phone,
          cc.email,
          cc.lead_status,
          cc.note,
          cc.created_at,
          cc.updated_at
        from customer_contacts cc
        left join customers c on c.customer_id = cc.customer_id
        left join staff s on s.staff_id = cc.assigned_staff_id
        order by coalesce(cc.updated_at, cc.created_at) desc
        limit 500
      `,
    ),
    pool.query<CustomerOptionQueryRow[]>(
      `
        select customer_id, customer_code, customer_name, phone
        from customers
        order by customer_name
        limit 500
      `,
    ),
    pool.query<SummaryQueryRow[]>(
      `
        select
          count(*) as total_contacts,
          sum(case when customer_id is not null then 1 else 0 end) as linked_contacts,
          sum(case when phone is not null and phone <> '' then 1 else 0 end) as contacts_with_phone
        from customer_contacts
      `,
    ),
  ]);

  const orderStatsByPhone = await getOrderStatsByPhone(contactRows[0].map((row) => row.phone ?? ""));
  const contacts = contactRows[0].map((row) => {
    const orderStats = orderStatsByPhone.get(normalizePhone(row.phone)) ?? emptyOrderStats;

    return {
      id: row.contact_id,
      customerId: row.customer_id,
      customerCode: row.customer_code,
      customerName: row.customer_name,
      assignedStaffId: row.assigned_staff_id,
      staffCode: row.staff_code,
      staffName: row.staff_name,
      name: row.contact_name ?? "Chua co ten lien he",
      title: row.title,
      phone: row.phone,
      email: row.email,
      leadStatus: normalizeLeadStatus(row.lead_status),
      note: row.note,
      createdAt: toDateString(row.created_at),
      updatedAt: toDateString(row.updated_at),
      orderStats,
    } satisfies ContactRow;
  });
  const summaryRow = summaryRows[0][0];

  return {
    contacts,
    customers: customerRows[0].map((row) => ({
      id: row.customer_id,
      code: row.customer_code,
      name: row.customer_name ?? "Chua co ten khach hang",
      phone: row.phone,
    })),
    summary: {
      totalContacts: toNumber(summaryRow?.total_contacts),
      linkedContacts: toNumber(summaryRow?.linked_contacts),
      contactsWithPhone: toNumber(summaryRow?.contacts_with_phone),
      contactsWithOrders: contacts.filter((contact) => contact.orderStats.orderCount > 0).length,
    },
  };
}
