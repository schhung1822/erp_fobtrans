import { type DashboardDateRange, getDefaultDashboardData, getLatestDashboardMonth } from "./_components/data";
import { MetricCards } from "./_components/metric-cards";
import { MonthFilter } from "./_components/month-filter";
import { PerformanceOverview } from "./_components/performance-overview";
import { SubscriberOverview } from "./_components/subscriber-overview";

export const dynamic = "force-dynamic";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(value: string | undefined) {
  if (!value || !MONTH_PATTERN.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

async function resolveMonthRange(searchParams: Record<string, string | string[] | undefined>) {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const latestMonth = await getLatestDashboardMonth();
  const fallbackMonth = parseMonth(latestMonth ?? undefined) ?? currentMonth;
  const rawFrom = Array.isArray(searchParams.fromMonth) ? searchParams.fromMonth[0] : searchParams.fromMonth;
  const rawTo = Array.isArray(searchParams.toMonth) ? searchParams.toMonth[0] : searchParams.toMonth;
  const from = parseMonth(rawFrom) ?? fallbackMonth;
  let to = parseMonth(rawTo) ?? from;

  if (to < from) to = from;

  const maxTo = addMonths(from, 11);
  if (to > maxTo) to = maxTo;

  return {
    currentMonth: monthKey(currentMonth),
    fromMonth: monthKey(from),
    toMonth: monthKey(to),
    range: {
      from: from.toISOString().slice(0, 10),
      to: addMonths(to, 1).toISOString().slice(0, 10),
      fromMonth: monthKey(from),
      toMonth: monthKey(to),
    } satisfies DashboardDateRange,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const { currentMonth, fromMonth, toMonth, range } = await resolveMonthRange(params);
  const { summary, daily, staffReports } = await getDefaultDashboardData(range);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Báo cáo tổng quan</h1>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <MonthFilter currentMonth={currentMonth} fromMonth={fromMonth} toMonth={toMonth} />
        </div>
      </div>
      <MetricCards summary={summary} />
      <PerformanceOverview data={daily} fromMonth={fromMonth} toMonth={toMonth} />
      <SubscriberOverview data={staffReports} fromMonth={fromMonth} toMonth={toMonth} />
    </div>
  );
}
