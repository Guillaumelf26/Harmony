import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/login");

  return <SettingsClient />;
}
