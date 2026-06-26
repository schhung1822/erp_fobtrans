import { getOrdersKanbanBoard, type KanbanDateRange } from "./_components/data";
import { Kanban } from "./_components/kanban";

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

function resolveMonth(searchParams: Record<string, string | string[] | undefined>) {
  const now = new Date();
  const currentMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const rawMonth = Array.isArray(searchParams.month) ? searchParams.month[0] : searchParams.month;
  const selectedMonthDate = parseMonth(rawMonth) ?? currentMonthDate;

  return {
    currentMonth: monthKey(currentMonthDate),
    selectedMonth: monthKey(selectedMonthDate),
    range: {
      from: selectedMonthDate.toISOString().slice(0, 10),
      to: addMonths(selectedMonthDate, 1).toISOString().slice(0, 10),
    } satisfies KanbanDateRange,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const { currentMonth, selectedMonth, range } = resolveMonth(params);
  const board = await getOrdersKanbanBoard(range);

  return (
    <div data-content-padding="false">
      <Kanban initialBoard={board} currentMonth={currentMonth} selectedMonth={selectedMonth} />
    </div>
  );
}
