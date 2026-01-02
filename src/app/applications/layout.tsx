import { requireAuth } from "@/lib/requireAuth";

export default async function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
