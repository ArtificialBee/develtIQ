import { Navigate } from "react-router";
import { SKLADISTE } from "~/lib/skladiste/ekrani";

/** The warehouse opens on its home screen, as in divetiq-cicak. */
export default function Skladiste() {
  return <Navigate to={`${SKLADISTE}/pocetna`} replace />;
}
