import { Page } from "~/components/Page";
import { TopBar } from "~/components/TopBar";
import { WorkItemTable } from "~/components/WorkItemTable";
import { SNAPSHOT } from "~/lib/snapshot";
import { formatBroj } from "~/lib/ui";
import { WORK_ITEMS } from "~/lib/work-items";

const kasni = WORK_ITEMS.filter((item) => item.stanje === "kasni").length;

/** Every open item of the person, from every app, in one table. Home cards open it filtered. */
export default function Zadaci() {
  return (
    <Page fill>
      <TopBar
        title="Moji zadaci"
        status={`${formatBroj(WORK_ITEMS.length)} otvoreno · ${formatBroj(kasni)} kasni`}
        startAt={SNAPSHOT.meta.sada}
      />
      <WorkItemTable items={WORK_ITEMS} className="flex-1" />
    </Page>
  );
}
