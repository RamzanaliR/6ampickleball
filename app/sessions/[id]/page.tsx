import { SessionDetail } from "./session-detail";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionDetail id={id} />;
}
