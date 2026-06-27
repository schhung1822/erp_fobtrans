import { PackageCheckIcon, PhoneCall, TrendingUp, UserPlus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import type { CrmSummary } from "./data";

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

export function KpiCards({ summary, selectedMonth }: { summary: CrmSummary; selectedMonth: string }) {
  const cards = [
    {
      title: "Tổng lead",
      value: summary.totalLeads.toLocaleString("vi-VN"),
      note: `${summary.newLeadsThisMonth.toLocaleString("vi-VN")} lead mới trong ${selectedMonth}`,
      icon: UserPlus,
    },
    {
      title: "Lead đang chăm sóc",
      value: summary.openLeads.toLocaleString("vi-VN"),
      note: `${summary.potentialLeads.toLocaleString("vi-VN")} tiềm năng, ${summary.silentLeads.toLocaleString("vi-VN")} im lặng`,
      icon: PhoneCall,
    },
    {
      title: "Chuyển đổi lead",
      value: formatPercent(summary.conversionRate),
      note: `${summary.leadsWithOrders.toLocaleString("vi-VN")} lead đã có đơn`,
      icon: TrendingUp,
    },
    {
      title: "Đơn từ CRM",
      value: summary.leadOrders.toLocaleString("vi-VN"),
      note: `${formatVnd(summary.totalRevenueVnd)} doanh thu đối soát`,
      icon: PackageCheckIcon,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-semibold text-2xl tracking-tight">Báo cáo CRM</h2>
        <p className="text-muted-foreground text-sm">
          Theo dõi lead, nhân sự phụ trách, tỷ lệ chuyển đổi thành đơn hàng và doanh thu đối soát.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
    </section>
  );
}
