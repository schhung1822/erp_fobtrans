import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BusinessDetails } from "./business-details";
import { ClientSelector } from "./client-selector";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";
import type { InvoiceOrderOption } from "./invoice-orders";
import { OrderSelector } from "./order-selector";
import { PaymentDetails } from "./payment-details";

export function InvoiceForm({ orders }: { orders: InvoiceOrderOption[] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Tabs defaultValue="invoice" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="invoice">Hoa don</TabsTrigger>
          <TabsTrigger value="payment">Thanh toan</TabsTrigger>
          <TabsTrigger value="business">Doanh nghiep</TabsTrigger>
        </TabsList>

        <TabsContent value="invoice" className="flex flex-col gap-4">
          <OrderSelector orders={orders} />

          <Separator />

          <InvoiceDetails />

          <Separator />

          <ClientSelector />

          <Separator />

          <InvoiceItems />

          <Separator />

          <InvoiceAdjustments />
        </TabsContent>

        <TabsContent value="payment" className="flex flex-col gap-4">
          <PaymentDetails />
        </TabsContent>

        <TabsContent value="business" className="flex flex-col gap-4">
          <BusinessDetails />
        </TabsContent>
      </Tabs>
    </div>
  );
}
