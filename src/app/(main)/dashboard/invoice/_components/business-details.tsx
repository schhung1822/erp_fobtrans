import { useRef, useTransition } from "react";

import Image from "next/image";

import { ImageUpIcon } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { uploadInvoiceLogo } from "./actions";
import type { InvoiceFormValues } from "./data";
import { SaveInvoiceSettingsButton } from "./save-invoice-settings-button";

function linesToText(lines: string[]) {
  return lines.join("\n");
}

function textToLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function LogoUploadField() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const { setValue, watch } = useFormContext<InvoiceFormValues>();
  const logoUrl = watch("from.logoUrl");

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("logo", file);
    formData.set("oldLogoUrl", logoUrl ?? "");

    startTransition(async () => {
      const nextLogoUrl = await uploadInvoiceLogo(formData);
      setValue("from.logoUrl", nextLogoUrl, { shouldDirty: true });
      event.target.value = "";
    });
  }

  return (
    <Field className="gap-2">
      <FieldLabel className="text-xs" htmlFor="business-logo-file">
        Logo
      </FieldLabel>
      <input
        ref={inputRef}
        id="business-logo-file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={handleLogoChange}
      />
      <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-2">
        <div className="flex h-12 w-24 shrink-0 items-center justify-center rounded-md border bg-background">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Logo"
              width={80}
              height={40}
              unoptimized
              className="max-h-10 max-w-20 object-contain"
            />
          ) : (
            <ImageUpIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <div className="truncate text-muted-foreground text-xs">{logoUrl || "ChÆ°a cÃ³ logo"}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isPending}
          >
            <ImageUpIcon />
            {isPending ? "Äang táº£i..." : "Táº£i logo lÃªn"}
          </Button>
        </div>
      </div>
    </Field>
  );
}

export function BusinessDetails() {
  const { control, register } = useFormContext<InvoiceFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-medium tracking-tight">ThÃ´ng tin doanh nghiá»‡p</h2>
        <SaveInvoiceSettingsButton scope="business" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="invoice-title">
            TiÃªu Ä‘á» trÃªn hÃ³a Ä‘Æ¡n
          </FieldLabel>
          <Input id="invoice-title" {...register("invoiceTitle")} />
        </Field>
        <LogoUploadField />
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-name">
            TÃªn doanh nghiá»‡p
          </FieldLabel>
          <Input id="business-name" {...register("from.name")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-tax-id">
            MÃ£ sá»‘ thuáº¿
          </FieldLabel>
          <Input id="business-tax-id" {...register("from.taxId")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-email">
            Email
          </FieldLabel>
          <Input id="business-email" type="email" {...register("from.email")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-phone">
            Sá»‘ Ä‘iá»‡n thoáº¡i
          </FieldLabel>
          <Input id="business-phone" {...register("from.phone")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-website">
            Website
          </FieldLabel>
          <Input id="business-website" {...register("from.website")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="business-issuer-name">
            NgÆ°á»i láº­p
          </FieldLabel>
          <Input id="business-issuer-name" {...register("from.issuerName")} />
        </Field>
        <Controller
          control={control}
          name="from.addressLines"
          render={({ field }) => (
            <Field className="gap-1 md:col-span-2">
              <FieldLabel className="text-xs" htmlFor="business-address">
                Äá»‹a chá»‰ doanh nghiá»‡p
              </FieldLabel>
              <Textarea
                id="business-address"
                rows={3}
                value={linesToText(field.value)}
                onChange={(event) => field.onChange(textToLines(event.target.value))}
              />
            </Field>
          )}
        />
      </div>
    </section>
  );
}
