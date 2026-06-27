import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, ShieldCheck, SquareUserRound, UserCog, UserRound } from "lucide-react";

export type UserStatus = "Đang hoạt động" | "Chờ lời mời" | "Đã vô hiệu hóa" | "Đã khóa" | "Tạm ngưng";

const teamValues = [
  "Nền tảng",
  "Tăng trưởng",
  "Doanh thu",
  "Vận hành khách hàng",
  "Công cụ nội bộ",
  "Tuân thủ",
  "Nhân sự",
  "Tài chính",
] as const;

export type UserTeam = string;

export type UserRow = {
  id: string;
  staffId: string | null;
  roleId: string | null;
  departmentId: string | null;
  username: string;
  email: string;
  joinedDate: string;
  lastActive: number;
  name: string;
  role: string;
  roleCode: string | null;
  roleTitle: string | null;
  status: UserStatus;
  isActive: boolean;
  staffStatus: string | null;
  team: UserTeam;
  workspace: string[];
  phone: string | null;
  note: string | null;
};

export type UserRoleOption = {
  id: string;
  code: string;
  name: string;
};

export type UserDepartmentOption = {
  id: string;
  code: string | null;
  name: string;
};

export type UsersLookups = {
  roles: UserRoleOption[];
  departments: UserDepartmentOption[];
};

export const filters = {
  role: [
    "Tất cả",
    "Chủ không gian làm việc",
    "Quản trị viên",
    "Quản trị thanh toán",
    "Quản trị bảo mật",
    "Trưởng nhóm",
    "Cộng tác viên",
    "Khách",
    "Chỉ xem",
  ],
  team: ["Tất cả", ...teamValues],
  status: ["Tất cả", "Đang hoạt động", "Chờ lời mời", "Đã vô hiệu hóa", "Đã khóa", "Tạm ngưng"],
  workspace: ["Tất cả", "Fobtrans ERP"],
};

export const roleMeta: Record<string, { className: string; icon: LucideIcon }> = {
  "Chủ không gian làm việc": { className: "text-emerald-300", icon: SquareUserRound },
  Admin: { className: "text-amber-300", icon: UserCog },
  "Quản trị thanh toán": { className: "text-violet-300", icon: BriefcaseBusiness },
  "Quản trị bảo mật": { className: "text-orange-300", icon: ShieldCheck },
  "Trưởng nhóm": { className: "text-fuchsia-300", icon: UserRound },
  Contributor: { className: "text-rose-300", icon: UserRound },
  Guest: { className: "text-muted-foreground", icon: UserRound },
  "Chỉ xem": { className: "text-muted-foreground", icon: UserRound },
};

export const statusMeta: Record<UserStatus, { badgeClass: string; dotClass: string }> = {
  "Đang hoạt động": {
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  "Chờ lời mời": {
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  "Đã vô hiệu hóa": {
    badgeClass: "border-border bg-muted/50 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  "Đã khóa": {
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
  "Tạm ngưng": {
    badgeClass: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
};
