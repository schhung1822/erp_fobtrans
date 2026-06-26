"use server";

import { revalidatePath } from "next/cache";

import {
  defaultNotificationSettings,
  saveNotificationSettings as persistNotificationSettings,
  type NotificationSettings,
} from "./notification-settings";
import { sendTestNotification as sendConfiguredTestNotification } from "./notification-sender";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim();
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function template(formData: FormData, key: string, fallback: string) {
  const value = text(formData, key);
  return value.length ? value : fallback;
}

function revalidateNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/dashboard/notifications");
}

export async function saveNotificationSettings(formData: FormData) {
  const settings: NotificationSettings = {
    larkEnabled: checkbox(formData, "larkEnabled"),
    telegramEnabled: checkbox(formData, "telegramEnabled"),
    orderEnabled: checkbox(formData, "orderEnabled"),
    contactEnabled: checkbox(formData, "contactEnabled"),
    larkWebhookUrl: text(formData, "larkWebhookUrl"),
    telegramBotToken: text(formData, "telegramBotToken"),
    telegramChatId: text(formData, "telegramChatId"),
    orderTemplate: template(formData, "orderTemplate", defaultNotificationSettings.orderTemplate),
    contactTemplate: template(formData, "contactTemplate", defaultNotificationSettings.contactTemplate),
  };

  if (settings.larkEnabled && !settings.larkWebhookUrl) {
    throw new Error("Vui long nhap webhook Lark truoc khi bat kenh Lark.");
  }

  if (settings.telegramEnabled && (!settings.telegramBotToken || !settings.telegramChatId)) {
    throw new Error("Vui long nhap token bot va group id Telegram truoc khi bat kenh Telegram.");
  }

  await persistNotificationSettings(settings);
  revalidateNotifications();
}

export async function sendTestNotification() {
  await sendConfiguredTestNotification();
}
