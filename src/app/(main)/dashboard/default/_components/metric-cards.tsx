import { DollarSign, PackageCheckIcon, UserPlus, UsersRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import type { DefaultDashboardSummary } from "./data";

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

export function MetricCards({ summary }: { summary: DefaultDashboardSummary }) {
  const cards = [
    {
      title: "Lien he moi",
      value: summary.newContacts.toLocaleString("vi-VN"),
      note: "Lead moi trong thang nay",
      icon: UserPlus,
    },
    {
      title: "Khach hang moi",
      value: summary.newCustomers.toLocaleString("vi-VN"),
      note: "Ho so customer moi trong thang nay",
      icon: UsersRound,
    },
    {
      title: "Don hang",
      value: summary.orders.toLocaleString("vi-VN"),
      note: "Don tao trong thang nay",
      icon: PackageCheckIcon,
    },
    {
      title: "Doanh thu",
      value: formatVnd(summary.revenueVnd),
      note: "Doanh thu doi soat trong thang nay",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
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
              <CardDescription>{card.note}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}