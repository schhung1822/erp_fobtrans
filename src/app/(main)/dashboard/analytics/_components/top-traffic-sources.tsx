"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { AnalyticsBarRow } from "./data";

const chartConfig = {
  value: {
    color: "var(--chart-1)",
    label: "Giá trị",
  },
} satisfies ChartConfig;

function BusinessBarChart({ data }: { data: AnalyticsBarRow[] }) {
  const renderValueLabel = (props: LabelProps) => {
    const { height, value, y } = props;

    return (
      <text
        className="fill-foreground"
        dominantBaseline="middle"
        dx={-6}
        fontSize={13}
        textAnchor="end"
        x="100%"
        y={Number(y) + Number(height) / 2}
      >
        {value}
      </text>
    );
  };

  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">Chưa có dữ liệu</div>;
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          right: 62,
        }}
      >
        <CartesianGrid horizontal={false} vertical={false} />
        <YAxis dataKey="label" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="value" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="value" fill="var(--color-value)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="label" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="formattedValue" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function TopTrafficSources({
  collectionRows,
  customerRows,
  leadStatusRows,
}: {
  collectionRows: AnalyticsBarRow[];
  customerRows: AnalyticsBarRow[];
  leadStatusRows: AnalyticsBarRow[];
}) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Cơ cấu báo cáo</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Tabs defaultValue="leads" className="flex flex-col gap-3">
          <TabsList className="w-full justify-start border-b px-2.5" variant="line">
            <TabsTrigger className="flex-none font-normal" value="leads">
              Lead
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="orders">
              Đơn hàng
            </TabsTrigger>
            <TabsTrigger className="flex-none font-normal" value="finance">
              Tài chính
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="px-4">
            <BusinessBarChart data={leadStatusRows} />
          </TabsContent>
          <TabsContent value="orders" className="px-4">
            <BusinessBarChart data={customerRows} />
          </TabsContent>
          <TabsContent value="finance" className="px-4">
            <BusinessBarChart data={collectionRows} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
