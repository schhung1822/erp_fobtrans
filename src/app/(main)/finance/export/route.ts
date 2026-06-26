import { NextResponse } from "next/server";

import { getFinanceData } from "../_components/data";

function csvValue(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function money(value: number) {
  return Math.round(value).toString();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? undefined;
  const data = await getFinanceData(month);
  const { summary } = data;

  const reportRows = [
    ["Thang", summary.month],
    ["Tong don", summary.totalOrders],
    ["Tong chi phi", money(summary.totalCostVnd)],
    ["Chi phi tinh cong no BHN", money(summary.totalBusinessCostVnd)],
    ["Tong so tien can thu", money(summary.totalRevenueVnd)],
    ["Da thu", money(summary.totalCollectedVnd)],
    ["Cong no con lai", money(summary.totalReceivableVnd)],
    ["Thue NK", money(summary.importTaxVnd)],
    ["Thue GTGT", money(summary.vatVnd)],
    ["Loi nhuan", money(summary.grossProfitVnd)],
    ["Loi nhuan phong kinh doanh", money(summary.businessProfitVnd)],
  ];

  const detailHeader = [
    "Ma don hang",
    "Ma khach hang",
    "Ten khach hang",
    "Ten hang",
    "Ngay giao hang",
    "Tinh trang thu tien",
    "Tinh trang xuat hoa don",
    "Tong chi phi",
    "Chi phi tinh cong no BHN",
    "Tong so tien can thu",
    "Da thu",
    "Cong no con lai",
    "Loi nhuan",
    "Loi nhuan phong kinh doanh",
  ];

  const detailRows = data.entries.map((entry) => [
    entry.orderCode,
    entry.customerCode ?? "",
    entry.customerName,
    entry.cargoName ?? "",
    entry.deliveryDate ?? "",
    entry.collectionStatus,
    entry.invoiceStatus,
    money(entry.totalCostVnd),
    money(entry.businessCostVnd),
    money(entry.totalChargeVnd),
    money(entry.paidAmountVnd),
    money(entry.remainingAmountVnd),
    money(entry.grossProfitVnd),
    money(entry.businessProfitVnd),
  ]);

  const csv = [["BAO CAO KE TOAN KHO BHN"], ...reportRows, [], detailHeader, ...detailRows]
    .map((row) => row.map(csvValue).join(","))
    .join("\r\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="bao-cao-ke-toan-${summary.month}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
