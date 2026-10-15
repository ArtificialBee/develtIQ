import { Link } from "react-router";
import {
  LuCalendarClock,
  LuClock,
  LuFileText,
  LuHistory,
  LuHourglass,
  LuInfo,
  LuListChecks,
  LuSquareArrowOutUpRight,
  LuTag,
  LuUserCheck,
} from "react-icons/lu";
import {
  DetailFields,
  DetailHero,
  DetailPage,
  DetailRail,
  DetailSection,
  DetailTimeline,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  type DetailTone,
  type TimelineStep,
} from "~/components/DetailPage";
import { ListRow } from "~/components/ListRow";
import { StatusBadge } from "~/components/StatusBadge";
import { appForModul } from "~/lib/apps";
import { SNAPSHOT, danaIzmedju, kratkiDatum, vrijemeIz } from "~/lib/snapshot";
import { formatBroj } from "~/lib/ui";
import { STANJE_LABELS, STANJE_TONES, type Stanje, type WorkItem } from "~/lib/work-items";

const STANJE_TONE: Partial<Record<Stanje, DetailTone>> = {
  kasni: "danger",
  danas: "warning",
};

const datumVrijeme = (iso: string) => {
  const vrijeme = vrijemeIz(iso);
  return vrijeme ? `${kratkiDatum(iso)} ${vrijeme}` : kratkiDatum(iso);
};

/** The deadline as a note: how late it is, or how long is left. */
const rokNote = (rok: string | undefined, danas: string): string => {
  if (!rok) return "nema roka";
  const dana = danaIzmedju(rok, danas);
  if (dana > 0) return `kasni ${formatBroj(dana)} d`;
  if (dana === 0) return "danas";
  return `za ${formatBroj(-dana)} d`;
};

/** Received, the deadline and today, in date order, so a missed deadline sits before today. */
const tokOf = (item: WorkItem, danas: string, sada: string): TimelineStep[] => {
  const steps: (TimelineStep & { at: string })[] = [
    { key: "danas", at: sada, title: "Danas", date: kratkiDatum(sada), note: `Čeka tvoju akciju: ${item.akcija}`, state: "current" },
  ];
  if (item.primljeno) {
    steps.push({ key: "primljeno", at: item.primljeno, title: "Primljeno", date: datumVrijeme(item.primljeno), note: item.detalj, state: "done" });
  }
  if (item.rok) {
    const prosao = item.rok < danas;
    steps.push({
      key: "rok",
      at: item.rok,
      title: prosao ? "Rok probijen" : "Rok",
      date: kratkiDatum(item.rok),
      note: rokNote(item.rok, danas),
      state: prosao ? "late" : "next",
    });
  }
  return steps.sort((a, b) => a.at.localeCompare(b.at));
};

/** One open item in a list: deadline, app icon, title, action and number, and its state. It opens its own page. */
const ItemRow = ({ item }: { item: WorkItem }) => (
  <li className="h-14">
    <Link
      to={item.url}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]"
    >
      <ListRow
        leading={item.rok ? kratkiDatum(item.rok) : "—"}
        icon={appForModul(item.modul).icon}
        title={item.naslov}
        meta={[item.akcija, item.broj].filter(Boolean).join(" · ")}
        tone={item.stanje === "kasni" ? "danger" : item.stanje === "danas" ? "warning" : undefined}
        trailing={<StatusBadge tone={STANJE_TONES[item.stanje]}>{STANJE_LABELS[item.stanje]}</StatusBadge>}
      />
    </Link>
  </li>
);

export interface WorkItemDetailsProps {
  item: WorkItem;
  /** Every open item of the person: the app counts on the left and the app's other items in the middle. */
  items: WorkItem[];
}

/**
 * One open item as a record page, the same for every app: where it stands in a
 * summary box, its fields, and the app's other open items under them, so the
 * middle column scrolls while the apps on the left and the timeline on the right
 * stay put. The main button is the item's own verb.
 */
export function WorkItemDetails({ item, items }: WorkItemDetailsProps) {
  const { danas, sada } = SNAPSHOT.meta;
  const app = appForModul(item.modul);
  const AppIcon = app.icon;
  const cekaDana = item.primljeno ? Math.max(0, danaIzmedju(item.primljeno, danas)) : undefined;
  const isteApp = items.filter((other) => other.id !== item.id && appForModul(other.modul).key === app.key);
  const apps = [...new Map(items.map((other) => [appForModul(other.modul).key, appForModul(other.modul)])).values()];

  return (
    <DetailPage
      topTitle="Moji zadaci"
      topStatus={`${app.label} · ${item.vrsta}`}
      alert={item.stanje === "kasni" && item.rok ? `${item.vrsta} kasni od ${kratkiDatum(item.rok)}` : undefined}
      crumbs={[
        { label: "Početna", to: "/home" },
        { label: "Moji zadaci", to: "/home/zadaci" },
        { label: item.broj ?? item.vrsta },
      ]}
      backTo="/home/zadaci"
      icon={AppIcon}
      title={item.naslov}
      subtitle={[item.broj, item.vrsta, app.label].filter(Boolean).join(" · ")}
      actions={
        <>
          <button type="button" className={PRIMARY_BUTTON}>
            {item.akcija}
          </button>
          <Link to={app.url} className={SECONDARY_BUTTON}>
            Otvori {app.label}
            <LuSquareArrowOutUpRight aria-hidden className="size-3.5" />
          </Link>
        </>
      }
      left={
        <DetailRail
          title="Po aplikacijama"
          items={apps.map((entry) => ({
            key: entry.key,
            icon: entry.icon,
            title: entry.label,
            value: formatBroj(items.filter((other) => appForModul(other.modul).key === entry.key).length),
            to: `/home/zadaci?app=${entry.key}`,
            active: entry.key === app.key,
          }))}
          more={
            <Link to="/home/zadaci" className="font-medium text-[#3B9DF8] hover:underline">
              Svi zadaci ({formatBroj(items.length)})
            </Link>
          }
        />
      }
      right={<DetailTimeline icon={LuHistory} title="Tok" steps={tokOf(item, danas, sada)} />}
    >
      <DetailHero
        facts={[
          { icon: AppIcon, text: app.label },
          { icon: LuTag, text: item.vrsta },
          ...(item.umjesto ? [{ icon: LuUserCheck, text: `Umjesto: ${item.umjesto}` }] : []),
        ]}
        tiles={[
          {
            icon: LuCalendarClock,
            label: "Rok",
            value: item.rok ? kratkiDatum(item.rok) : "—",
            note: rokNote(item.rok, danas),
            tone: STANJE_TONE[item.stanje],
          },
          {
            icon: LuClock,
            label: "Primljeno",
            value: item.primljeno ? kratkiDatum(item.primljeno) : "—",
            note: item.primljeno ? vrijemeIz(item.primljeno) || undefined : "vlastiti zadatak",
          },
          { icon: LuHourglass, label: "Čeka", value: cekaDana === undefined ? "—" : `${formatBroj(cekaDana)} d`, note: "od prijema" },
          { icon: LuInfo, label: "Stanje", value: STANJE_LABELS[item.stanje], note: item.akcija, tone: STANJE_TONE[item.stanje] },
        ]}
      />
      <DetailSection icon={LuFileText} title="Detalji">
        <DetailFields
          fields={[
            { label: "Broj", value: item.broj ? <span className="font-mono tabular-nums">{item.broj}</span> : "—" },
            { label: "Vrsta", value: item.vrsta },
            { label: "Aplikacija", value: app.label },
            { label: "Akcija", value: item.akcija },
            { label: "Rok", value: item.rok ? kratkiDatum(item.rok) : "Bez roka" },
            { label: "Primljeno", value: item.primljeno ? datumVrijeme(item.primljeno) : "—" },
            { label: "Umjesto", value: item.umjesto ?? "—" },
            { label: "Stanje", value: STANJE_LABELS[item.stanje] },
            { label: "Opis", value: item.detalj ?? "—", wide: true },
          ]}
        />
      </DetailSection>
      <DetailSection
        icon={LuListChecks}
        title={`Ostalo u aplikaciji ${app.label}`}
        action={
          <Link to={`/home/zadaci?app=${app.key}`} className="text-sm font-medium text-[#3B9DF8] hover:underline">
            Otvori sve ({formatBroj(isteApp.length)})
          </Link>
        }
      >
        {isteApp.length === 0 ? (
          <p className="px-1 text-sm text-gray-500">Nema drugih otvorenih zadataka u ovoj aplikaciji.</p>
        ) : (
          <ul>
            {isteApp.map((other) => (
              <ItemRow key={other.id} item={other} />
            ))}
          </ul>
        )}
      </DetailSection>
    </DetailPage>
  );
}
