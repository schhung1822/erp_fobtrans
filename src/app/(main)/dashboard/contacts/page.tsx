import { LinkIcon, PhoneCallIcon, ShoppingCartIcon, UsersRoundIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getOrderLookups } from "@/app/(main)/dashboard/orders/_components/data";

import { ContactsTable } from "./_components/contacts-table";
import { getContactsData } from "./_components/data";
import type { ContactsSummary } from "./_components/schema";

export const dynamic = "force-dynamic";

function SummaryCards({ summary }: { summary: ContactsSummary }) {
  const cards = [
    {
      title: "Tổng liên hệ",
      value: summary.totalContacts.toLocaleString("vi-VN"),
      note: "Số liên hệ mới",
      icon: UsersRoundIcon,
    },
    {
      title: "Gần khách hàng",
      value: summary.linkedContacts.toLocaleString("vi-VN"),
      note: "Liên hệ gần với khách hàng",
      icon: LinkIcon,
    },
    {
      title: "Có đơn hàng",
      value: summary.contactsWithOrders.toLocaleString("vi-VN"),
      note: "Liên hệ có SDT trùng với đơn hàng",
      icon: ShoppingCartIcon,
    },
    {
      title: "Có điện thoại",
      value: summary.contactsWithPhone.toLocaleString("vi-VN"),
      note: "Lead có số điện thoại",
      icon: PhoneCallIcon,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} size="sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground text-sm">{card.title}</CardTitle>
              <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </span>
            </CardHeader>
            <CardContent className="grid gap-1">
              <div className="font-semibold text-2xl tracking-tight">{card.value}</div>
              <div className="text-muted-foreground text-xs">{card.note}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function Page() {
  const [{ contacts, summary }, orderLookups] = await Promise.all([getContactsData(), getOrderLookups()]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Quản lý liên hệ mới</h1>
        </div>
        <Badge variant="outline" className="w-fit">
          customer_contacts: {summary.totalContacts.toLocaleString("vi-VN")}
        </Badge>
      </div>

      <SummaryCards summary={summary} />
      <ContactsTable data={contacts} orderLookups={orderLookups} />
    </div>
  );
}
