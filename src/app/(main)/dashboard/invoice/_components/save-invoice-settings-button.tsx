"use client";

import { useTransition } from "react";

import { SaveIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { saveInvoiceBusinessSettings, saveInvoicePaymentSettings } from "./actions";
import type { InvoiceFormValues } from "./data";

type SettingsScope = "payment" | "business";

function setText(formData: FormData, key: string, value: string | string[] | null | undefined) {
  formData.set(key, Array.isArray(value) ? value.join("\n") : value ?? "");
}

function buildPaymentFormData(values: InvoiceFormValues) {
  const formData = new FormData();
  setText(formData, "from.paymentAccountName", values.from.paymentAccountName);
  setText(formData, "from.paymentBankName", values.from.paymentBankName);
  setText(formData, "from.routingNumber", values.from.routingNumber);
  return formData;
}

function buildBusinessFormData(values: InvoiceFormValues) {
  const formData = new FormData();
  setText(formData, "invoiceTitle", values.invoiceTitle);
  setText(formData, "from.name", values.from.name);
  setText(formData, "from.logoUrl", values.from.logoUrl);
  setText(formData, "from.email", values.from.email);
  setText(formData, "from.phone", values.from.phone);
  setText(formData, "from.website", values.from.website);
  setText(formData, "from.addressLines", values.from.addressLines);
  setText(formData, "from.taxId", values.from.taxId);
  setText(formData, "from.issuerName", values.from.issuerName);
  return formData;
}

export function SaveInvoiceSettingsButton({ scope }: { scope: SettingsScope }) {
  const { getValues } = useFormContext<InvoiceFormValues>();
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const values = getValues();
    const action = scope === "payment" ? saveInvoicePaymentSettings : saveInvoiceBusinessSettings;
    const formData = scope === "payment" ? buildPaymentFormData(values) : buildBusinessFormData(values);

    startTransition(async () => {
      try {
        await action(formData);
        toast.success(scope === "payment" ? "Da luu cau hinh thanh toan." : "Da luu cau hinh doanh nghiep.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Khong the luu cau hinh.");
      }
    });
  }

  return (
    <Button type="button" size="sm" onClick={handleSave} disabled={isPending} className="w-fit">
      <SaveIcon />
      {isPending ? "Dang luu..." : "Luu cau hinh"}
    </Button>
  );
}