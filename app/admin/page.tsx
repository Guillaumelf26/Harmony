import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerAuthSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== Role.ADMIN) redirect("/login");

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950" />}>
      <AdminClient />
    </Suspense>
  );
}

