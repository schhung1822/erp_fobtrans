import "server-only";

import { getNotificationSettings } from "./notification-settings";

type NotificationData = Record<string, string | number | null | undefined>;

export interface OrderNotificationPayload extends NotificationData {
  order_code: string;
  customer_name: string | null;
  phone: string | null;
  receiver_name: string | null;
  total_charge_vnd: number;
  note: string | null;
}

export interface ContactNotificationPayload extends NotificationData {
  contact_name: string;
  customer_name: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
}

function formatValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  return value;
}

function renderTemplate(template: string, data: NotificationData) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => formatValue(data[key]));
}

async function postLark(webhookUrl: string, message: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg_type: "text",
      content: { text: message },
    }),
  });

  if (!response.ok) {
    throw new Error(`Lark webhook failed: ${response.status}`);
  }
}

async function postTelegram(botToken: string, chatId: string, message: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram webhook failed: ${response.status}`);
  }
}

async function sendConfiguredNotification(message: string, eventEnabled: boolean) {
  const settings = await getNotificationSettings();
  if (!eventEnabled) return;

  const tasks: Promise<void>[] = [];

  if (settings.larkEnabled && settings.larkWebhookUrl) {
    tasks.push(postLark(settings.larkWebhookUrl, message));
  }

  if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
    tasks.push(postTelegram(settings.telegramBotToken, settings.telegramChatId, message));
  }

  if (tasks.length === 0) return;

  const results = await Promise.allSettled(tasks);
  const failed = results.find((result) => result.status === "rejected");

  if (failed?.status === "rejected") {
    throw failed.reason;
  }
}

export async function sendOrderCreatedNotification(payload: OrderNotificationPayload) {
  const settings = await getNotificationSettings();
  const message = renderTemplate(settings.orderTemplate, payload);
  await sendConfiguredNotification(message, settings.orderEnabled);
}

export async function sendContactCreatedNotification(payload: ContactNotificationPayload) {
  const settings = await getNotificationSettings();
  const message = renderTemplate(settings.contactTemplate, payload);
  await sendConfiguredNotification(message, settings.contactEnabled);
}

export async function sendTestNotification() {
  await sendConfiguredNotification(
    "Thong bao kiem tra tu Fobtrans. Neu ban nhan duoc tin nay, cau hinh webhook dang hoat dong.",
    true,
  );
}
