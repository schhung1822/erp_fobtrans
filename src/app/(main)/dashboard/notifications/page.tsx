import { BellRingIcon, MessageCircleIcon, SendIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getNotificationSettings } from "./_components/notification-settings";
import { NotificationsForm } from "./_components/notifications-form";

export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getNotificationSettings();

  const cards = [
    {
      title: "Sự kiện",
      value:
        [settings.orderEnabled && "Đơn hàng", settings.contactEnabled && "Liên hệ"].filter(Boolean).join(", ") || "Tắt",
      icon: BellRingIcon,
    },
    {
      title: "Lark",
      value: settings.larkEnabled ? "Đang bật" : "Đang tắt",
      icon: MessageCircleIcon,
    },
    {
      title: "Telegram",
      value: settings.telegramEnabled ? "Đang bật" : "Đang tắt",
      icon: SendIcon,
    },
  ];

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Quản lý thông báo</h1>
        <p className="text-muted-foreground text-sm">
          Cấu hình mẫu thông báo đơn hàng và liên hệ mới gửi đến nhóm Lark Messenger hoặc Telegram.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title} size="sm">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-muted-foreground text-sm">{card.title}</CardTitle>
                <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="font-semibold text-xl tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <NotificationsForm settings={settings} />
    </div>
  );
}
