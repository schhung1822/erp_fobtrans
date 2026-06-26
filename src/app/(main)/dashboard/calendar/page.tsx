import { Calendar } from "./_components/calendar";
import { getOrderCalendarEvents } from "./_components/events-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const events = await getOrderCalendarEvents();

  return <Calendar events={events} />;
}
