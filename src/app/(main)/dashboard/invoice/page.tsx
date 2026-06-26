import { Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Invoice } from "./_components/invoice";
import { getInvoiceOrderOptions } from "./_components/invoice-orders";
import { getInvoiceDefaultValues } from "./_components/invoice-settings";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const selectedOrderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const [orders, defaultValues] = await Promise.all([getInvoiceOrderOptions(), getInvoiceDefaultValues()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-3xl leading-none tracking-tight">Thue & Hoa Don</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline">
            <Save data-icon="inline-start" />
            Luu nhap
          </Button>
          <Button type="button">
            <Send data-icon="inline-start" />
            gui hoa don
          </Button>
        </div>
      </div>

      <Invoice orders={orders} defaultValues={defaultValues} selectedOrderId={selectedOrderId} />
    </div>
  );
}
