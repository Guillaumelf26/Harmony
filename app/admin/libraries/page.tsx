import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import LibrariesClient from "./LibrariesClient";

export default async function LibrariesPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  return <LibrariesClient />;
}
