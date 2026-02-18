/**
 * Layout mode Live : plein écran, sombre, sans chrome admin.
 */
export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark fixed inset-0 bg-zinc-950 text-zinc-100 overflow-hidden">
      {children}
    </div>
  );
}
