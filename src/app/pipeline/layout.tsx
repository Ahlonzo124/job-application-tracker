import { requireAuth } from "@/lib/requireAuth";

export default async function PipelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
