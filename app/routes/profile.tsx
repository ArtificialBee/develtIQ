import { LuUser } from "react-icons/lu";
import { Page } from "~/components/Page";
import { Panel } from "~/components/Panel";
import { TopBar } from "~/components/TopBar";
import { useAuthEmail } from "~/hooks/useAuthEmail";
import { SNAPSHOT } from "~/lib/snapshot";

export default function Profile() {
  const { email, error } = useAuthEmail();

  return (
    <Page fill>
      <TopBar title="Profil" startAt={SNAPSHOT.meta.sada} />
      <Panel title="Profil" description="Podaci za prijavljeni račun." icon={LuUser}>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          <span className="font-medium">E-mail:</span>{" "}
          {error || email || "Nema spremljenog e-maila."}
        </p>
      </Panel>
    </Page>
  );
}
