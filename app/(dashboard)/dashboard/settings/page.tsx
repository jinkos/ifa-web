
import SettingsClient from "./SettingsClient";
import SettingsTeamClient from "./SettingsTeamClient";
import { getUser, getTeamForUser } from "@/lib/db/queries";

export default async function SettingsPage() {
  const user = await getUser();
  const team = await getTeamForUser();
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Team Settings</h1>
      <SettingsClient user={user} team={team} />
      <SettingsTeamClient />
    </section>
  );
}
