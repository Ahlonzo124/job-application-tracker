import { requireAuth } from "../../lib/requireAuth";

export default async function ExtractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
