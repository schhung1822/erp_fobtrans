import { Badge } from "@/components/ui/badge";

import { getOperationsData } from "./_components/data";
import { OperationsTable } from "./_components/operations-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const warehouses = await getOperationsData();

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Quản lý kho & vận hành</h1>
        </div>
        <Badge variant="outline" className="w-fit">
          Kho: {warehouses.length.toLocaleString("vi-VN")}
        </Badge>
      </div>

      <OperationsTable data={warehouses} />
    </div>
  );
}
