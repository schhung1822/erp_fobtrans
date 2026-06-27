import "server-only";

import { getNotificationSettings } from "./notification-settings";

type NotificationData = Record<string, string | number | null | undefined>;
type NotificationKind = "order" | "contact" | "test";

const larkCardMeta: Record<NotificationKind, { title: string; template: string }> = {
  order: { title: "Đơn hàng mới", template: "blue" },
  contact: { title: "Liên hệ mới", template: "green" },
  test: { title: "Kiểm tra kết nối", template: "turquoise" },
};

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

function formatLarkMarkdown(message: string) {
  return message
    .split(/\r?\n/)
    .map((line) => {
      const field = line.match(/^([^:]{1,40}):\s*(.*)$/);
      return field ? `**${field[1]}:** ${field[2] || "-"}` : line;
    })
    .join("\n");
}

async function postLark(webhookUrl: string, message: string, kind: NotificationKind) {
  const meta = larkCardMeta[kind];
  const sentAt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg_type: "interactive",
      card: {
        config: {
          enable_forward: true,
          wide_screen_mode: true,
        },
        header: {
          template: meta.template,
          title: {
            tag: "plain_text",
            content: meta.title,
          },
        },
        elements: [
          {
            tag: "div",
            text: {
              tag: "lark_md",
              content: formatLarkMarkdown(message),
            },
          },
          { tag: "hr" },
          {
            tag: "note",
            elements: [
              {
                tag: "plain_text",
                content: `Fobtrans ERP · ${sentAt}`,
              },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Lark webhook failed: ${response.status}`);
  }

  const result = (await response.json().catch(() => null)) as { code?: number; msg?: string } | null;
  if (result?.code && result.code !== 0) {
    throw new Error(`Lark webhook failed: ${result.msg ?? `code ${result.code}`}`);
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

async function sendConfiguredNotification(message: string, eventEnabled: boolean, kind: NotificationKind) {
  const settings = await getNotificationSettings();
  if (!eventEnabled) return;

  const tasks: Promise<void>[] = [];

  if (settings.larkEnabled && settings.larkWebhookUrl) {
    tasks.push(postLark(settings.larkWebhookUrl, message, kind));
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
  await sendConfiguredNotification(message, settings.orderEnabled, "order");
}

export async function sendContactCreatedNotification(payload: ContactNotificationPayload) {
  const settings = await getNotificationSettings();
  const message = renderTemplate(settings.contactTemplate, payload);
  await sendConfiguredNotification(message, settings.contactEnabled, "contact");
}

export async function sendTestNotification() {
  await sendConfiguredNotification(
    "Thông báo kiểm tra từ Fobtrans. Nếu bạn nhận được tin này, cấu hình webhook đang hoạt động.",
    true,
    "test",
  );
}
