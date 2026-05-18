import { redirect } from "next/navigation";

/** Legacy route — downloads only, no streaming */
export default async function WatchRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/download/${id}`);
}
