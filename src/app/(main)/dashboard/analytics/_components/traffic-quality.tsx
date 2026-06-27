"use client";

import { format, parseISO } from "date-fns";
import { Ellipsis } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { AnalyticsDailyPoint } from "./data";

const chartConfig = {
  leads: {
    color: "var(--chart-1)",
    label: "Lead mới",
  },
  orders: {
    color: "var(--chart-2)",
    label: "Tong don",
  },
  leadOrders: {
    color: "var(--chart-4)",
    label: "Đơn theo lead",
  },
  revenueVnd: {
    color: "var(--chart-3)",
    label: "Doanh thu đối soát",
  },
  receivableVnd: {
    color: "var(--chart-5)",
    label: "Cong no",
  },
} satisfies ChartConfig;

function formatCompactVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

export function TrafficQuality({ data }: { data: AnalyticsDailyPoint[] }) {
  const hasData = data.some(
    (item) => item.leads > 0 || item.orders > 0 || item.leadOrders > 0 || item.revenueVnd > 0 || item.receivableVnd > 0,
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Sóng lead - đơn hàng - tài chính</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <ComposedChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <defs>
                <linearGradient id="fillAnalyticsLeads" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-leads)" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="var(--color-leads)" stopOpacity={0.06} />
                </linearGradient>
                <linearGradient id="fillAnalyticsOrders" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                minTickGap={24}
                tickFormatter={(value) => format(parseISO(String(value)), "dd/MM")}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                yAxisId="count"
                axisLine={false}
                allowDecimals={false}
                tickLine={false}
                tickMargin={10}
                width={32}
              />
              <YAxis
                yAxisId="money"
                axisLine={false}
                orientation="right"
                tickFormatter={(value) => formatCompactVnd(Number(value))}
                tickLine={false}
                tickMargin={10}
                width={52}
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
                dataKey="leads"
                type="monotone"
                fill="url(#fillAnalyticsLeads)"
                stroke="var(--color-leads)"
                strokeWidth={1.6}
                dot={false}
              />
              <Area
                yAxisId="count"
                dataKey="orders"
                type="monotone"
                fill="url(#fillAnalyticsOrders)"
                stroke="var(--color-orders)"
                strokeWidth={1.6}
                dot={false}
              />
              <Line
                yAxisId="count"
                dataKey="leadOrders"
                type="monotone"
                stroke="var(--color-leadOrders)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="money"
                dataKey="revenueVnd"
                type="monotone"
                stroke="var(--color-revenueVnd)"
                strokeWidth={1.8}
                dot={false}
              />
              <Line
                yAxisId="money"
                dataKey="receivableVnd"
                type="monotone"
                stroke="var(--color-receivableVnd)"
                strokeDasharray="4 4"
                strokeWidth={1.6}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex h-80 items-center justify-center rounded-md border border-dashed text-center text-muted-foreground text-sm">
            Chưa có dữ liệu lead, đơn hàng hoặc tài chính trong kỳ này
          </div>
        )}
      </CardContent>
    </Card>
  );
}
