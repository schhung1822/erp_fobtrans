export const leadStatuses = ["new", "potential", "loyal", "silent"] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Moi",
  potential: "Tiem nang",
  loyal: "Khach hang than thiet",
  silent: "Im lang",
};

export interface ContactCustomerOption {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
}

export interface ContactStaffOption {
  id: string;
  code: string | null;
  name: string;
}

export interface ContactOrderStats {
  orderCount: number;
  totalChargeVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  lastOrderAt: string | null;
}

export interface ContactRow {
  id: string;
  customerId: string | null;
  customerCode: string | null;
  customerName: string | null;
  assignedStaffId: string | null;
  staffCode: string | null;
  staffName: string | null;
  name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  leadStatus: LeadStatus;
  note: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  orderStats: ContactOrderStats;
}

export interface ContactsSummary {
  totalContacts: number;
  linkedContacts: number;
  contactsWithPhone: number;
  contactsWithOrders: number;
}
