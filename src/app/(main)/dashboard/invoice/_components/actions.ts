"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { defaultInvoiceValues } from "./data";
import { getSavedInvoiceSettings, saveInvoiceSettings } from "./invoice-settings";

const LOGO_UPLOAD_URL_PREFIX = "/uploads/invoice-logos/";
const LOGO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "invoice-logos");

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function optionalText(formData: FormData, key: string) {
  return text(formData, key) ?? "";
}

function addressLines(formData: FormData) {
  return optionalText(formData, "from.addressLines")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function deleteLocalInvoiceLogo(logoUrl: string | null) {
  if (!logoUrl?.startsWith(LOGO_UPLOAD_URL_PREFIX)) return;

  const fileName = path.basename(logoUrl);
  const filePath = path.join(LOGO_UPLOAD_DIR, fileName);

  if (!filePath.startsWith(LOGO_UPLOAD_DIR)) return;

  await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

function revalidateInvoicePages() {
  revalidatePath("/invoice");
  revalidatePath("/dashboard/invoice");
}

export async function uploadInvoiceLogo(formData: FormData) {
  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Vui long chon file logo.");
  }

  const extension = imageExtensions[file.type];
  if (!extension) {
    throw new Error("Logo chi ho tro JPG, PNG, WEBP hoac SVG.");
  }

  await mkdir(LOGO_UPLOAD_DIR, { recursive: true });
  await deleteLocalInvoiceLogo(text(formData, "oldLogoUrl"));

  const fileName = `${randomUUID()}.${extension}`;
  const filePath = path.join(LOGO_UPLOAD_DIR, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, bytes);

  return `${LOGO_UPLOAD_URL_PREFIX}${fileName}`;
}

export async function saveInvoicePaymentSettings(formData: FormData) {
  const current = await getSavedInvoiceSettings();

  await saveInvoiceSettings({
    ...current,
    from: {
      ...current.from,
      paymentAccountName: optionalText(formData, "from.paymentAccountName"),
      paymentBankName: optionalText(formData, "from.paymentBankName"),
      routingNumber: optionalText(formData, "from.routingNumber"),
    },
  });

  revalidateInvoicePages();
}

export async function saveInvoiceBusinessSettings(formData: FormData) {
  const current = await getSavedInvoiceSettings();

  await saveInvoiceSettings({
    ...current,
    invoiceTitle: optionalText(formData, "invoiceTitle") || defaultInvoiceValues.invoiceTitle,
    from: {
      ...current.from,
      name: optionalText(formData, "from.name") || defaultInvoiceValues.from.name,
      logoUrl: optionalText(formData, "from.logoUrl"),
      email: optionalText(formData, "from.email"),
      phone: optionalText(formData, "from.phone"),
      website: optionalText(formData, "from.website"),
      addressLines: addressLines(formData),
      taxId: optionalText(formData, "from.taxId"),
      issuerName: optionalText(formData, "from.issuerName") || defaultInvoiceValues.from.issuerName,
    },
  });

  revalidateInvoicePages();
}