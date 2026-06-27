"use client";

import { format, parseISO } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { DefaultDashboardDay } from "./data";

const chartConfig = {
  contacts: {
    label: "Lead",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Tổng đơn hàng",
    color: "var(--chart-2)",
  },

  revenueVnd: {
    label: "Doanh thu đối soát",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatCompactVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function PerformanceOverview({ data }: { data: DefaultDashboardDay[]; fromMonth: string; toMonth: string }) {
  const hasData = data.some((item) => item.contacts > 0 || item.orders > 0 || item.revenueVnd > 0);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="leading-none">Thống kê theo ngày</CardTitle>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-80 w-full">
            <ComposedChart data={data} margin={{ top: 0, right: 8, left: 0 }}>
              <defs>
                <linearGradient id="fillContacts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-contacts)" stopOpacity={0.42} />
                  <stop offset="95%" stopColor="var(--color-contacts)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value) => format(parseISO(value), "dd/MM")}
              />
              <YAxis yAxisId="count" width={28} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                width={48}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCompactVnd(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-60"
                    indicator="line"
                    labelFormatter={(value) => format(parseISO(String(value)), "dd/MM/yyyy")}
                  />
                }
              />
              <ChartLegend verticalAlign="top" content={<ChartLegendContent className="mb-5 justify-end" />} />
              <Area
                yAxisId="count"
                dataKey="contacts"
                type="monotone"
                fill="url(#fillContacts)"
                stroke="var(--color-contacts)"
                strokeWidth={1.6}
                dot={false}
                fillOpacity={1}
              />
              <Area
                yAxisId="count"
                dataKey="orders"
                type="monotone"
                fill="url(#fillOrders)"
                stroke="var(--color-orders)"
                strokeWidth={1.6}
                dot={false}
                fillOpacity={0.8}
              />

              <Line
                yAxisId="revenue"
                dataKey="revenueVnd"
                type="monotone"
                stroke="var(--color-revenueVnd)"
                strokeWidth={1.8}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-md border border-dashed text-center text-muted-foreground text-sm">
            Chưa có dữ liệu trong kỳ đã chọn
          </div>
        )}
      </CardContent>
    </Card>
  );
}
