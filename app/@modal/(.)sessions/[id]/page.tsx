import { RouteModal } from "@/components/route-modal";
import { SessionDetail } from "@/app/sessions/[id]/session-detail";

export default async function InterceptedSessionModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RouteModal>
      <SessionDetail id={id} compact />
    </RouteModal>
  );
}
