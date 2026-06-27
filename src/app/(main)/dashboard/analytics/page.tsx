import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnalyticsKpiStrip } from "./_components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { getAnalyticsData } from "./_components/data";
import { RealtimeVisitors } from "./_components/realtime-visitors";
import { TopPages } from "./_components/top-pages";
import { TopTrafficSources } from "./_components/top-traffic-sources";
import { TrafficQuality } from "./_components/traffic-quality";

export default async function Page() {
  const data = await getAnalyticsData();

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">BÃ¡o cÃ¡o tá»•ng há»£p</h1>
        <p className="text-muted-foreground text-sm">
          Theo dÃµi sÃ³ng lead, Ä‘Æ¡n hÃ ng, doanh thu Ä‘á»‘i soÃ¡t vÃ  cÃ´ng ná»£ tá»« dá»¯ liá»‡u váº­n hÃ nh thá»±c
          táº¿.
        </p>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Tá»•ng quan</TabsTrigger>
            <TabsTrigger value="staff">NhÃ¢n sá»±</TabsTrigger>
            <TabsTrigger value="segments">CÆ¡ cáº¥u</TabsTrigger>
          </TabsList>

          <AnalyticsToolbar rangeLabel={data.rangeLabel} />
        </div>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <AnalyticsKpiStrip kpis={data.kpis} />

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TrafficQuality data={data.daily} />
            </div>
            <div className="xl:col-span-5">
              <RealtimeVisitors data={data.daily} liveLeads={data.liveLeads} liveOrders={data.liveOrders} />
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TopPages rows={data.staffRows} />
            </div>
            <div className="xl:col-span-5 xl:col-start-8">
              <TopTrafficSources
                collectionRows={data.collectionRows}
                customerRows={data.customerRows}
                leadStatusRows={data.leadStatusRows}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="staff">
          <TopPages rows={data.staffRows} />
        </TabsContent>

        <TabsContent value="segments">
          <TopTrafficSources
            collectionRows={data.collectionRows}
            customerRows={data.customerRows}
            leadStatusRows={data.leadStatusRows}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
