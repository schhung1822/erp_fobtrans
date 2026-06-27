import { getCrmDashboardData } from "./_components/data";
import { KpiCards } from "./_components/kpi-cards";
import { OpportunitiesSection } from "./_components/opportunities-section";
import { PipelineActivity } from "./_components/pipeline-activity";
import { TaskReminders } from "./_components/task-reminders";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getCrmDashboardData();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <KpiCards summary={data.summary} selectedMonth={data.selectedMonth} />
      <PipelineActivity data={data.monthlyFlow} summary={data.summary} />
      <TaskReminders alerts={data.alerts} staffReports={data.staffReports} />
      <OpportunitiesSection data={data.recentLeads} />
    </div>
  );
}
