"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

import type { AnalyticsDailyPoint } from "./data";

const chartConfig = {
  activity: {
    color: "var(--chart-3)",
    label: "Lead + don",
  },
} satisfies ChartConfig;

type ActivityPoint = AnalyticsDailyPoint & {
  activity: number;
};

function ActivityBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props;
  const barPayload = payload as ActivityPoint | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const activity = barPayload?.activity ?? 0;
  const fill = "var(--color-activity)";
  const fillOpacity = activity >= 5 ? 0.95 : 0.45;
  const baselineFill = activity === 0 ? "var(--destructive)" : fill;
  const baselineOpacity = activity === 0 ? 1 : fillOpacity;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 4;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {activity > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  );
}

export function RealtimeVisitors({
  data,
  liveLeads,
  liveOrders,
}: {
  data: AnalyticsDailyPoint[];
  liveLeads: number;
  liveOrders: number;
}) {
  const activityData: ActivityPoint[] = data.slice(-14).map((item) => ({
    ...item,
    activity: item.leads + item.orders,
  }));
  const maxActivity = Math.max(...activityData.map((item) => item.activity), 1);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Nhịp hoạt động gần đây</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">{liveLeads + liveOrders}</span>
            <span className="text-muted-foreground text-sm">hôm gần nhất</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span>DB</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-36 w-full">
          <BarChart data={activityData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={3}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, Math.max(maxActivity, 1)]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="activity" fill="var(--color-activity)" shape={ActivityBarShape} />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-2">
          <div className="flex items-center justify-between gap-3 border-border/50 border-r border-b pt-1 pr-5 pb-4">
            <span className="min-w-0 flex-1 truncate text-sm">Lead mới</span>
            <span className="text-sm tabular-nums">{liveLeads}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-border/50 border-b pt-1 pb-4 pl-5">
            <span className="min-w-0 flex-1 truncate text-sm">Đơn hàng</span>
            <span className="text-sm tabular-nums">{liveOrders}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-border/50 border-r pt-4 pr-5 pb-1">
            <span className="min-w-0 flex-1 truncate text-sm">Lead 14 ngày</span>
            <span className="text-sm tabular-nums">{activityData.reduce((sum, item) => sum + item.leads, 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-4 pb-1 pl-5">
            <span className="min-w-0 flex-1 truncate text-sm">Đơn 14 ngày</span>
            <span className="text-sm tabular-nums">{activityData.reduce((sum, item) => sum + item.orders, 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
