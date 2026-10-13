import { Navigate, useParams } from "react-router";
import { RecordPage } from "~/components/RecordPage";
import { ekranUrl } from "~/lib/skladiste/ekrani";
import { SCREENS } from "~/lib/skladiste/registar";

/** One record of a warehouse screen, such as a prijemnica. Unknown ids go back to the list. */
export default function SkladisteZapis() {
  const { sekcija = "", ekran = "", id = "" } = useParams();
  const view = SCREENS[`${sekcija}/${ekran}`]?.record?.(id);
  if (!view) return <Navigate to={ekranUrl(sekcija, ekran)} replace />;
  // A new record starts on its first tab.
  return <RecordPage key={id} view={view} />;
}
