import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  return <SettingsClient />;
}
