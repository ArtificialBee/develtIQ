import { useMemo } from "react";
import { Navigate, useParams } from "react-router";
import { CardDetails } from "~/components/CardDetails";
import { karticaDetails } from "~/lib/home-details";
import { SNAPSHOT } from "~/lib/snapshot";

/** Details for a /home card. The `:kljuc` segment selects which card. */
export default function Kartica() {
  const { kljuc } = useParams<{ kljuc: string }>();
  const data = useMemo(() => (kljuc ? karticaDetails(SNAPSHOT, kljuc) : null), [kljuc]);
  if (!data) return <Navigate to="/home" replace />;
  return <CardDetails {...data} />;
}
