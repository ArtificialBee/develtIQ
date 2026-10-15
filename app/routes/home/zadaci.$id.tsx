import { Navigate, useParams } from "react-router";
import { WorkItemDetails } from "~/components/WorkItemDetails";
import { WORK_ITEMS } from "~/lib/work-items";

/** One open item of the person, from any app. The id in the URL selects which. */
export default function Zadatak() {
  const { id } = useParams<{ id: string }>();
  const item = WORK_ITEMS.find((candidate) => candidate.id === id);
  if (!item) return <Navigate to="/home/zadaci" replace />;
  return <WorkItemDetails item={item} items={WORK_ITEMS} />;
}
