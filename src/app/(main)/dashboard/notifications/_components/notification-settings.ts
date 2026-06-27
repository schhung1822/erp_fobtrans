import "server-only";

import type { RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

export interface NotificationSettings {
  larkEnabled: boolean;
  telegramEnabled: boolean;
  orderEnabled: boolean;
  contactEnabled: boolean;
  larkWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  orderTemplate: string;
  contactTemplate: string;
}

interface SettingsRow extends RowDataPacket {
  lark_enabled: number | boolean | null;
  telegram_enabled: number | boolean | null;
  order_enabled: number | boolean | null;
  contact_enabled: number | boolean | null;
  lark_webhook_url: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  order_template: string | null;
  contact_template: string | null;
}

export const defaultNotificationSettings: NotificationSettings = {
  larkEnabled: false,
  telegramEnabled: false,
  orderEnabled: true,
  contactEnabled: true,
  larkWebhookUrl: "",
  telegramBotToken: "",
  telegramChatId: "",
  orderTemplate:
    "Đơn hàng mới: {order_code}\nKhách hàng: {customer_name}\nSĐT: {phone}\nNgười nhận: {receiver_name}\nTổng tiền: {total_charge_vnd}\nGhi chú: {note}",
  contactTemplate:
    "Liên hệ mới: {contact_name}\nKhách hàng: {customer_name}\nChức danh: {title}\nSĐT: {phone}\nEmail: {email}\nGhi chú: {note}",
};

export async function ensureNotificationSettingsTable() {
  const pool = getDbPool();

  await pool.query(`
    create table if not exists notification_settings (
      setting_id varchar(64) primary key,
      lark_enabled tinyint(1) not null default 0,
      telegram_enabled tinyint(1) not null default 0,
      order_enabled tinyint(1) not null default 1,
      contact_enabled tinyint(1) not null default 1,
      lark_webhook_url text null,
      telegram_bot_token text null,
      telegram_chat_id varchar(191) null,
      order_template text null,
      contact_template text null,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp on update current_timestamp
    )
  `);
}

function enabled(value: number | boolean | null | undefined, fallback: boolean) {
  if (value === null || value === undefined) return fallback;
  return Boolean(value);
}

function fromRow(row: SettingsRow | undefined): NotificationSettings {
  if (!row) return defaultNotificationSettings;

  return {
    larkEnabled: enabled(row.lark_enabled, defaultNotificationSettings.larkEnabled),
    telegramEnabled: enabled(row.telegram_enabled, defaultNotificationSettings.telegramEnabled),
    orderEnabled: enabled(row.order_enabled, defaultNotificationSettings.orderEnabled),
    contactEnabled: enabled(row.contact_enabled, defaultNotificationSettings.contactEnabled),
    larkWebhookUrl: row.lark_webhook_url ?? "",
    telegramBotToken: row.telegram_bot_token ?? "",
    telegramChatId: row.telegram_chat_id ?? "",
    orderTemplate: row.order_template ?? defaultNotificationSettings.orderTemplate,
    contactTemplate: row.contact_template ?? defaultNotificationSettings.contactTemplate,
  };
}

export async function getNotificationSettings() {
  await ensureNotificationSettingsTable();

  const pool = getDbPool();
  const [rows] = await pool.query<SettingsRow[]>("select * from notification_settings where setting_id = ? limit 1", [
    "default",
  ]);

  return fromRow(rows[0]);
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  await ensureNotificationSettingsTable();

  const pool = getDbPool();
  await pool.query(
    `
      insert into notification_settings (
        setting_id,
        lark_enabled,
        telegram_enabled,
        order_enabled,
        contact_enabled,
        lark_webhook_url,
        telegram_bot_token,
        telegram_chat_id,
        order_template,
        contact_template
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on duplicate key update
        lark_enabled = values(lark_enabled),
        telegram_enabled = values(telegram_enabled),
        order_enabled = values(order_enabled),
        contact_enabled = values(contact_enabled),
        lark_webhook_url = values(lark_webhook_url),
        telegram_bot_token = values(telegram_bot_token),
        telegram_chat_id = values(telegram_chat_id),
        order_template = values(order_template),
        contact_template = values(contact_template),
        updated_at = current_timestamp
    `,
    [
      "default",
      settings.larkEnabled ? 1 : 0,
      settings.telegramEnabled ? 1 : 0,
      settings.orderEnabled ? 1 : 0,
      settings.contactEnabled ? 1 : 0,
      settings.larkWebhookUrl,
      settings.telegramBotToken,
      settings.telegramChatId,
      settings.orderTemplate,
      settings.contactTemplate,
    ],
  );
}
