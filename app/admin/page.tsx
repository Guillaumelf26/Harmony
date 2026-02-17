import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/login");

  return (
    <AdminClient />
  );
}

