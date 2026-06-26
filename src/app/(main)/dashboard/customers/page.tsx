import { AlertCircleIcon, DatabaseIcon, UserRoundCheckIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import { CustomersTable } from "./_components/customers-table";
import { getCustomersData } from "./_components/data";
import type { CustomersSummary } from "./_components/schema";

export const dynamic = "force-dynamic";

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function SummaryCards({ summary }: { summary: CustomersSummary }) {
  const cards = [
    {
      title: "Tong khach hang",
      value: summary.totalCustomers.toLocaleString("vi-VN"),
      note: "So ho so trong bang customers",
      icon: UsersIcon,
    },
    {
      title: "Da phat sinh don",
      value: summary.customersWithOrders.toLocaleString("vi-VN"),
      note: "Khach hang co it nhat 1 don",
      icon: UserRoundCheckIcon,
    },
    {
      title: "Doanh thu",
      value: formatVnd(summary.totalRevenueVnd),
      note: "Tong gia tri don theo khach hang",
      icon: DatabaseIcon,
    },
    {
      title: "Cong no",
      value: formatVnd(summary.totalReceivableVnd),
      note: "So tien con phai thu",
      icon: AlertCircleIcon,
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
  const { customers, summary } = await getCustomersData();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Quan ly khach hang</h1>
        </div>
        <Badge variant="outline" className="w-fit">
          customers: {summary.totalCustomers.toLocaleString("vi-VN")}
        </Badge>
      </div>

      <SummaryCards summary={summary} />
      <CustomersTable data={customers} />
    </div>
  );
}
