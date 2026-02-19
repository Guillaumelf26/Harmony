import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-zinc-950 text-zinc-100" />}
    >
      <RegisterClient />
    </Suspense>
  );
}
