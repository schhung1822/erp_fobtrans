import { Users } from "./_components/users";
import { getUsersData, getUsersLookups } from "./_components/users-data";

export const dynamic = "force-dynamic";

export default async function Page() {
  const users = await getUsersData();
  const lookups = await getUsersLookups();

  return <Users users={users} lookups={lookups} />;
}