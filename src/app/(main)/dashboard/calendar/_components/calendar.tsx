"use client";

import * as React from "react";

import { useCalendarController } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { differenceInCalendarDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, XIcon } from "lucide-react";

import { EventCalendarViews } from "@/components/calendar/event-calendar-views";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { OrderCalendarEvent, OrderCalendarEventKind } from "./events-data";

const views = [
  { key: "dayGridMonth", label: "Tháng" },
  { key: "timeGridWeek", label: "Tuần" },
  { key: "timeGridDay", label: "Ngày" },
];

const calendars: Array<{ key: "all" | OrderCalendarEventKind; label: string }> = [
  { key: "all", label: "Tất cả lịch" },
  { key: "delivery", label: "Lịch giao hàng" },
  { key: "payment", label: "Lịch thanh toán" },
];

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin];

function isEventInRange(event: OrderCalendarEvent, start: Date, end: Date) {
  const eventDate = new Date(event.start);

  return eventDate >= start && eventDate < end;
}

export function Calendar({ events }: { events: OrderCalendarEvent[] }) {
  const controller = useCalendarController();
  const [selectedCalendar, setSelectedCalendar] = React.useState<(typeof calendars)[number]["key"]>("all");
  const [visibleRange, setVisibleRange] = React.useState(() => {
    const now = new Date();

    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
    };
  });
  const [dateInfo, setDateInfo] = React.useState(() => {
    const now = new Date();

    return {
      title: format(now, "MMMM yyyy"),
      days: differenceInCalendarDays(endOfMonth(now), startOfMonth(now)) + 1,
    };
  });

  const filteredEvents = React.useMemo(() => {
    if (selectedCalendar === "all") return events;

    return events.filter((event) => event.extendedProps.kind === selectedCalendar);
  }, [events, selectedCalendar]);

  const eventCount = React.useMemo(
    () => filteredEvents.filter((event) => isEventInRange(event, visibleRange.start, visibleRange.end)).length,
    [filteredEvents, visibleRange],
  );
  const title = dateInfo.title;
  const days = dateInfo.days;

  return (
    <div className="flex flex-col overflow-hidden rounded-md border">
      <div className="flex flex-col gap-4 border-b bg-sidebar p-4 text-sidebar-foreground lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 shrink-0 flex-col gap-1">
          <div className="font-medium text-lg leading-none">{title}</div>
          <p className="text-muted-foreground text-sm">
            {days} Ngày - {eventCount} lịch đơn hàng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedCalendar}
            onValueChange={(value) => setSelectedCalendar(value as typeof selectedCalendar)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <CalendarIcon />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {calendars.map((calendar) => (
                  <SelectItem key={calendar.key} value={calendar.key}>
                    {calendar.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <ButtonGroup>
            <Button size="icon" variant="outline" onClick={() => controller.prev()}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" onClick={() => controller.today()}>
              Hôm nay
            </Button>
            <Button size="icon" variant="outline" onClick={() => controller.next()}>
              <ChevronRight />
            </Button>
          </ButtonGroup>
          <Select
            value={controller.view?.type ?? views[0].key}
            onValueChange={(value) => {
              controller.changeView(value);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {views.map((v) => (
                  <SelectItem key={v.key} value={v.key}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <EventCalendarViews
        controller={controller}
        initialView={views[0].key}
        plugins={[...plugins]}
        popoverCloseContent={() => <XIcon className="size-5 text-muted-foreground group-hover:text-foreground" />}
        events={filteredEvents}
        nowIndicator
        datesSet={(info) => {
          setDateInfo({
            title: info.view.title,
            days: differenceInCalendarDays(info.view.currentEnd, info.view.currentStart),
          });
          setVisibleRange({ start: info.start, end: info.end });
        }}
      />
    </div>
  );
}
