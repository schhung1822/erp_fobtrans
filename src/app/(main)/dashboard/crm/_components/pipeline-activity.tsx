"use client";

import { Bar, BarChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

import type { CrmMonthlyFlow, CrmSummary } from "./data";

const chartConfig = {
  leads: {
    label: "Lead mới",
    color: "var(--chart-1)",
  },
  leadOrders: {
    label: "Đơn theo lead",
    color: "var(--chart-2)",
  },
  revenueVnd: {
    label: "Doanh thu đối soát",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function formatCompactVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", timeZone: "UTC", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

export function PipelineActivity({ data, summary }: { data: CrmMonthlyFlow[]; summary: CrmSummary }) {
  const totalLeadsInRange = data.reduce((sum, item) => sum + item.leads, 0);
  const totalLeadOrdersInRange = data.reduce((sum, item) => sum + item.leadOrders, 0);
  const rangeConversion = totalLeadsInRange > 0 ? Math.round((totalLeadOrdersInRange / totalLeadsInRange) * 100) : 0;
  const hasData = data.some((item) => item.leads > 0 || item.leadOrders > 0 || item.revenueVnd > 0);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-12">
        <CardHeader>
          <CardTitle>Luồng lead và đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <ChartContainer config={chartConfig} className="h-72 w-full lg:col-span-8">
                <BarChart data={data} margin={{ left: 0, right: 8, top: 0, bottom: 0 }} barSize={28}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => formatMonthLabel(String(value))}
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
                    content={
                      <ChartTooltipContent
                        className="w-60"
                        indicator="line"
                        labelFormatter={(value) => formatMonthLabel(String(value))}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="count" dataKey="leads" fill="var(--color-leads)" radius={[6, 6, 0, 0]} />
                  <Bar yAxisId="count" dataKey="leadOrders" fill="var(--color-leadOrders)" radius={[6, 6, 0, 0]} />
                  <Line
                    yAxisId="revenue"
                    dataKey="revenueVnd"
                    type="monotone"
                    stroke="var(--color-revenueVnd)"
                    strokeWidth={1.8}
                    dot={false}
                  />
                </BarChart>
              </ChartContainer>

              <div className="flex flex-col gap-5 rounded-lg p-4 lg:col-span-4">
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-4xl tabular-nums leading-none">
                    {summary.leadOrders.toLocaleString("vi-VN")}{" "}
                    <span className="font-normal text-lg text-muted-foreground">đơn</span>
                  </div>
                  <p className="text-muted-foreground text-sm">Tổng số đơn hàng xác định có nguồn từ lead CRM.</p>
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                  <div className="text-[11px] text-muted-foreground uppercase tracking-widest">
                    Tỷ lệ chuyển đổi 6 tháng
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="font-medium text-2xl tabular-nums leading-none">
                      {rangeConversion}% <span className="font-normal text-muted-foreground text-sm">lead ra đơn</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {totalLeadOrdersInRange.toLocaleString("vi-VN")} đơn từ{" "}
                      {totalLeadsInRange.toLocaleString("vi-VN")} lead mới.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-0.5">
                    <Progress value={rangeConversion} className="h-2.5" />
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-medium tabular-nums">{formatVnd(summary.totalRevenueVnd)}</div>
                      <div className="text-muted-foreground tabular-nums">doanh thu</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed text-center text-muted-foreground text-sm">
              Chưa có dữ liệu lead hoặc đơn hàng trong kỳ báo cáo
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
