import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerAuthSession } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950" />}>
        <AdminClient />
      </Suspense>
    </ErrorBoundary>
  );
}

