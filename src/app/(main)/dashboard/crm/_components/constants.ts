export type CrmLeadStatus = "new" | "potential" | "loyal" | "silent";

export const crmLeadStatusLabels: Record<CrmLeadStatus, string> = {
  new: "Mới",
  potential: "Tiềm năng",
  loyal: "Khách hàng thân thiết",
  silent: "Im lặng",
};
