import "server-only";

import type { RowDataPacket } from "mysql2";

import { getDbPool } from "@/lib/db";

import { defaultInvoiceValues, type InvoiceFormValues } from "./data";

interface InvoiceSettingsRow extends RowDataPacket {
  config_json: string | null;
}

export async function ensureInvoiceSettingsTable() {
  const pool = getDbPool();
  await pool.query(`
    create table if not exists invoice_settings (
      setting_id varchar(64) not null primary key,
      config_json longtext not null,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArrayValue(value: unknown) {
  return Array.isArray(value) ? value.filter((line): line is string => typeof line === "string") : [];
}

function mergeSavedInvoiceSettings(saved: unknown): InvoiceFormValues {
  if (!isRecord(saved)) return defaultInvoiceValues;

  const savedFrom = isRecord(saved.from) ? saved.from : {};

  return {
    ...defaultInvoiceValues,
    invoiceTitle: stringValue(saved.invoiceTitle, defaultInvoiceValues.invoiceTitle),
    from: {
      ...defaultInvoiceValues.from,
      name: stringValue(savedFrom.name, defaultInvoiceValues.from.name),
      logoUrl: stringValue(savedFrom.logoUrl, defaultInvoiceValues.from.logoUrl),
      email: stringValue(savedFrom.email, defaultInvoiceValues.from.email),
      phone: stringValue(savedFrom.phone, defaultInvoiceValues.from.phone),
      website: stringValue(savedFrom.website, defaultInvoiceValues.from.website),
      addressLines: stringArrayValue(savedFrom.addressLines),
      taxId: stringValue(savedFrom.taxId, defaultInvoiceValues.from.taxId),
      paymentAccountName: stringValue(savedFrom.paymentAccountName, defaultInvoiceValues.from.paymentAccountName),
      paymentBankName: stringValue(savedFrom.paymentBankName, defaultInvoiceValues.from.paymentBankName),
      routingNumber: stringValue(savedFrom.routingNumber, defaultInvoiceValues.from.routingNumber),
      issuerName: stringValue(savedFrom.issuerName, defaultInvoiceValues.from.issuerName),
    },
  };
}

export async function getInvoiceDefaultValues() {
  await ensureInvoiceSettingsTable();

  const pool = getDbPool();
  const [rows] = await pool.query<InvoiceSettingsRow[]>(
    "select config_json from invoice_settings where setting_id = 'default' limit 1",
  );
  const config = rows[0]?.config_json;

  if (!config) return defaultInvoiceValues;

  try {
    return mergeSavedInvoiceSettings(JSON.parse(config));
  } catch {
    return defaultInvoiceValues;
  }
}

export async function getSavedInvoiceSettings() {
  return getInvoiceDefaultValues();
}

export async function saveInvoiceSettings(settings: InvoiceFormValues) {
  await ensureInvoiceSettingsTable();

  const pool = getDbPool();
  await pool.query(
    `
      insert into invoice_settings (setting_id, config_json)
      values ('default', ?)
      on duplicate key update config_json = values(config_json), updated_at = current_timestamp
    `,
    [JSON.stringify(settings)],
  );
}
