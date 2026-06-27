import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AnalyticsKpi } from "./data";

function formatTrend(value: number) {
  return `${Math.abs(value).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

export function AnalyticsKpiStrip({ kpis }: { kpis: AnalyticsKpi[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {kpis.map((item) => {
          const isPositive = item.trendPercent >= 0;

          return (
            <Card key={item.key}>
              <CardHeader>
                <CardTitle className="font-normal text-sm">{item.title}</CardTitle>
                <CardAction>
                  <Ellipsis className="size-4" />
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="truncate text-2xl leading-none tracking-tight">{item.value}</div>
                  <Badge
                    className={
                      isPositive
                        ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {isPositive ? <ArrowUpRight /> : <ArrowDownRight />}
                    {formatTrend(item.trendPercent)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <span className="truncate">{item.detail}</span>
                  <span>-</span>
                  <span>30 ngay</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
