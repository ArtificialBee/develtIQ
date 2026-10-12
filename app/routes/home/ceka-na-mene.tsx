import { useMemo } from "react";
import { Navigate } from "react-router";
import { CardDetails } from "~/components/CardDetails";
import { karticaDetails } from "~/lib/home-details";
import { SNAPSHOT } from "~/lib/snapshot";

/** Full list of actions waiting on the person. Each row links to its own details page. */
export default function CekaNaMene() {
  const data = useMemo(() => karticaDetails(SNAPSHOT, "ceka-na-mene"), []);
  if (!data) return <Navigate to="/home" replace />;
  return <CardDetails {...data} />;
}
