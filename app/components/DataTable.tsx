import { useId, useMemo, useState } from "react";
import { LuArrowDownUp, LuCheck, LuListFilter, LuSearch } from "react-icons/lu";
import { MultiSelect } from "~/components/MultiSelect";
import { Sheet } from "~/components/Sheet";
import { StatusBadge, type StatusTone } from "~/components/StatusBadge";
import { Table, type TableColumn } from "~/components/Table";
import { ToolbarSelect } from "~/components/ToolbarSelect";
import { formatBroj } from "~/lib/ui";

const MIN_SEARCH_LENGTH = 3;

const dots: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-gray-400",
};

export interface FilterOption {
  value: string;
  label: string;
  /** Shows the option as a status badge in the sheet and as a colored dot in the header. */
  tone?: StatusTone;
  /** How many records the option holds, when the screen filters the rows itself. */
  count?: number;
}

export interface DataTableFilter<T> {
  key: string;
  /** The sheet's heading for the group, such as "Status". */
  legend: string;
  options: FilterOption[];
  /**
   * Whether a row holds the value. Left out, the screen filters the rows itself (such as
   * before it sums them per item) and the table only shows and reports the choice.
   */
  matches?: (row: T, value: string) => boolean;
}

/** A number to compare each row's value with, such as a document's value: greater than, equal to or less than. */
export interface DataTableAmountFilter<T> {
  key: string;
  legend: string;
  value: (row: T) => number;
  /** Shown in the field, such as "KM". */
  unit?: string;
}

/** A span of days, from and to, picked on a calendar. */
export interface DataTableDateFilter<T> {
  key: string;
  legend: string;
  /** The row's day, yyyy-mm-dd. */
  value: (row: T) => string;
}

/** One choice of how the whole list is shown, such as "Prikaz" or a report's period: a dropdown on top of the filter sheet. */
export interface DataTableChoice {
  key: string;
  legend: string;
  /** The first option is the default one. */
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export interface QuickFilter {
  /** The header dropdown's first option, such as "Svi statusi". */
  allLabel: string;
  /** Its label when the sheet ticked several, such as "3 statusa". */
  several: (count: number) => string;
  /** Accessible name, such as "Filtriraj po statusu". */
  label: string;
}

export interface SortField<T> {
  value: string;
  label: string;
  /** Low to high, A to Ž. */
  compare: (a: T, b: T) => number;
  /** Rows with no value for this field, such as no deadline. They stay last in either direction. */
  isEmpty?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  title: string;
  /** The line under the title; a function gets the rows left after search and filters, such as for their count and value. */
  description: string | ((rows: T[]) => string);
  columns: TableColumn<T>[];
  /** Every row, before search and filters. */
  rows: T[];
  getRowKey: (row: T) => string;
  getRowHref?: (row: T) => string;
  /** The texts of a row the search looks through. */
  searchText: (row: T) => string[];
  /** Accessible name of the search field, such as "Pretraži pokazatelje". */
  searchLabel: string;
  /** The sheet's groups. With `quick`, the first one is also a dropdown in the header. */
  filters: DataTableFilter<T>[];
  quick?: QuickFilter;
  /** The screen's own buttons, before the tools, the main one first, such as "Nova prijemnica". */
  buttons?: string[];
  sortFields: SortField<T>[];
  /** Values ticked when the table opens, by filter key, such as from the URL. */
  initialFilters?: Record<string, string[]>;
  /** How many records there are before any filter, when the screen filters `rows` itself: "Prikazano 4 od 64". */
  total?: number;
  /** The ticked values kept by the screen, such as in the URL. With it, `onFiltersChange` saves every change. */
  filterValues?: Record<string, string[]>;
  onFiltersChange?: (values: Record<string, string[]>) => void;
  /** Choices of how the list is shown, above the filters in the same sheet. */
  choices?: DataTableChoice[];
  /** Number comparisons, under the checkbox filters in the sheet. */
  amountFilters?: DataTableAmountFilter<T>[];
  /** Day spans, last in the sheet. */
  dateFilters?: DataTableDateFilter<T>[];
  /** What the rows are, in the genitive plural: "Prikazano 6 od 14 pokazatelja". */
  noun: string;
  /** The text of an empty list before any search or filter, such as why it is still empty. */
  emptyText?: string;
  fill?: boolean;
  /** Only the tools and the table, with no card, for a table inside a tab. */
  bare?: boolean;
  className?: string;
}

type Operator = "gt" | "eq" | "lt";
interface Amount {
  operator: Operator;
  /** As typed: "1.034,50" or "1034.5". */
  text: string;
}
interface Span {
  from: string;
  to: string;
}

const OPERATORS: { value: Operator; sign: string; label: string }[] = [
  { value: "gt", sign: ">", label: "Veće od" },
  { value: "eq", sign: "=", label: "Jednako" },
  { value: "lt", sign: "<", label: "Manje od" },
];

/** A typed amount as a number, with "." for thousands and "," for decimals as in "1.034,50"; null while empty or unreadable. */
const parseAmount = (text: string) => {
  const clean = text.replace(/\s/g, "");
  if (clean === "") return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

const compareAmount = (value: number, { operator, text }: Amount) => {
  const limit = parseAmount(text);
  if (limit === null) return true;
  // Money has two decimals, so equal means equal to the cent.
  if (operator === "eq") return Math.abs(value - limit) < 0.005;
  return operator === "gt" ? value > limit : value < limit;
};

/** A copy of `set` with `value` added, or removed when it was there. */
const toggled = (set: Set<string>, value: string) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

const CHOICE_ROW =
  "-mx-2 flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-gray-800 transition-colors hover:bg-gray-50";
const LEGEND = "mb-2 text-xs font-medium uppercase tracking-[0.14em] text-gray-500";

interface FilterGroupProps {
  legend: string;
  options: (FilterOption & { count: number })[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}

// Up to this many options a filter shows as checkboxes; more, and it is a dropdown.
const MAX_CHECKBOXES = 3;

/**
 * A titled filter, each option with how many rows it holds; none picked means all.
 * Up to three options are checkboxes, more are a dropdown that picks several.
 */
const FilterGroup = ({ legend, options, selected, onToggle }: FilterGroupProps) => (
  <fieldset className="mb-6 last:mb-0">
    <legend className={LEGEND}>{legend}</legend>
    {options.length > MAX_CHECKBOXES ? (
      <MultiSelect label={legend} options={options} selected={selected} onToggle={onToggle} />
    ) : (
      <div className="space-y-0.5">
        {options.map((option) => (
          <label key={option.value} className={CHOICE_ROW}>
            {/* A drawn checkbox: the browser's own picks a dark tick on this blue. */}
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input
                type="checkbox"
                checked={selected.has(option.value)}
                onChange={() => onToggle(option.value)}
                className="peer size-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white transition-colors checked:border-[#3B9DF8] checked:bg-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]/40"
              />
              <LuCheck
                aria-hidden
                strokeWidth={3}
                className="pointer-events-none absolute size-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
              />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {option.tone ? <StatusBadge tone={option.tone}>{option.label}</StatusBadge> : option.label}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-gray-400">{formatBroj(option.count)}</span>
          </label>
        ))}
      </div>
    )}
  </fieldset>
);

interface ChoiceGroupProps {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

/** A titled list of radio buttons: one choice, applied as soon as it is picked. */
const ChoiceGroup = ({ legend, options, value, onChange }: ChoiceGroupProps) => {
  const name = useId();
  return (
    <fieldset className="mb-6 last:mb-0">
      <legend className={LEGEND}>{legend}</legend>
      <div className="space-y-0.5">
        {options.map((option) => (
          <label key={option.value} className={CHOICE_ROW}>
            <span className="relative flex size-5 shrink-0 items-center justify-center">
              <input
                type="radio"
                name={name}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="peer size-5 cursor-pointer appearance-none rounded-full border border-gray-300 bg-white transition-colors checked:border-[#3B9DF8] checked:bg-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]/40"
              />
              <span aria-hidden className="pointer-events-none absolute size-2 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100" />
            </span>
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const FIELD =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-gray-800 outline-none transition [color-scheme:light] placeholder:text-gray-400 focus:border-[#3B9DF8] focus:ring-2 focus:ring-[#3B9DF8]/15";

interface AmountGroupProps {
  legend: string;
  unit?: string;
  value: Amount;
  onChange: (value: Amount) => void;
}

/** A comparison (>, =, <) picked in a dropdown and an amount, applied as it is typed. */
const AmountGroup = ({ legend, unit, value, onChange }: AmountGroupProps) => (
  <fieldset className="mb-6 last:mb-0">
    <legend className={LEGEND}>{legend}</legend>
    <div className="flex items-center gap-2">
      <div className="w-36 shrink-0">
        <ToolbarSelect
          wide
          label={`${legend}: poređenje`}
          value={value.operator}
          options={OPERATORS.map((operator) => ({ value: operator.value, label: `${operator.sign} ${operator.label.toLowerCase()}` }))}
          onChange={(operator) => onChange({ ...value, operator: operator as Operator })}
        />
      </div>
      <label className="relative flex min-w-0 flex-1 items-center">
        <input
          type="text"
          inputMode="decimal"
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.currentTarget.value })}
          aria-label={`${legend}: iznos`}
          placeholder="Iznos"
          className={`${FIELD} ${unit ? "pr-10" : ""} ${value.text !== "" && parseAmount(value.text) === null ? "border-red-300" : ""}`}
        />
        {unit && <span className="pointer-events-none absolute right-3 text-xs text-gray-400">{unit}</span>}
      </label>
    </div>
  </fieldset>
);

interface SelectGroupProps {
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

/** A titled dropdown: one choice for the whole list, applied as soon as it is picked. */
const SelectGroup = ({ legend, options, value, onChange }: SelectGroupProps) => (
  <fieldset className="mb-6 last:mb-0">
    <legend className={LEGEND}>{legend}</legend>
    <ToolbarSelect wide label={legend} value={value} options={options} active={value !== options[0]?.value} onChange={onChange} />
  </fieldset>
);

interface DateGroupProps {
  legend: string;
  value: Span;
  onChange: (value: Span) => void;
}

/** From and to, each a day picked on the browser's calendar; either may stay empty. */
const DateGroup = ({ legend, value, onChange }: DateGroupProps) => (
  <fieldset className="mb-6 last:mb-0">
    <legend className={LEGEND}>{legend}</legend>
    <div className="grid grid-cols-2 gap-2">
      <label className="min-w-0">
        <span className="mb-1 block text-xs text-gray-500">Od</span>
        <input
          type="date"
          value={value.from}
          max={value.to || undefined}
          onChange={(event) => onChange({ ...value, from: event.currentTarget.value })}
          aria-label={`${legend}: od`}
          className={FIELD}
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-xs text-gray-500">Do</span>
        <input
          type="date"
          value={value.to}
          min={value.from || undefined}
          onChange={(event) => onChange({ ...value, to: event.currentTarget.value })}
          aria-label={`${legend}: do`}
          className={FIELD}
        />
      </label>
    </div>
  </fieldset>
);

const NO_AMOUNT: Amount = { operator: "gt", text: "" };
const NO_SPAN: Span = { from: "", to: "" };

const DIRECTIONS = [
  { value: "asc", label: "Rastuće (od manjeg / A–Ž)" },
  { value: "desc", label: "Opadajuće (od većeg / Ž–A)" },
];

const iconButton =
  "relative flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-[#3B9DF8]/10 hover:text-[#3B9DF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8]";

/**
 * The one table with tools in the app: search (from three letters), a quick
 * dropdown for the first filter, and two sheets from the right that apply what is
 * picked at once: sorting (a field and a direction) and every filter as checkboxes. Every list of records uses it,
 * so they all look and work the same; a table only says its columns, filters,
 * search texts and sort fields.
 */
export function DataTable<T>({
  title,
  description,
  columns,
  rows: allRows,
  getRowKey,
  getRowHref,
  searchText,
  searchLabel,
  filters,
  quick,
  buttons = [],
  sortFields,
  initialFilters = {},
  total,
  filterValues,
  onFiltersChange,
  choices = [],
  amountFilters = [],
  dateFilters = [],
  noun,
  emptyText = "Nema podataka.",
  fill = false,
  bare = false,
  className = "",
}: DataTableProps<T>) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [search, setSearch] = useState("");
  // Ticked values by filter key. An empty set lets every value through.
  const [ownSelected, setOwnSelected] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(filters.map((filter) => [filter.key, new Set(initialFilters[filter.key] ?? [])])),
  );
  const selected = useMemo(
    () => (filterValues ? Object.fromEntries(filters.map((filter) => [filter.key, new Set(filterValues[filter.key] ?? [])])) : ownSelected),
    [filterValues, filters, ownSelected],
  );
  const setSelected = (next: Record<string, Set<string>>) => {
    if (onFiltersChange) onFiltersChange(Object.fromEntries(Object.entries(next).map(([key, values]) => [key, [...values]])));
    if (!filterValues) setOwnSelected(next);
  };
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(null);
  const [amounts, setAmounts] = useState<Record<string, Amount>>({});
  const [spans, setSpans] = useState<Record<string, Span>>({});
  const amountOf = (key: string) => amounts[key] ?? NO_AMOUNT;
  const spanOf = (key: string) => spans[key] ?? NO_SPAN;

  // A choice off its default counts as one filter, so the button shows the list is narrowed.
  const filterCount =
    Object.values(selected).reduce((sum, set) => sum + set.size, 0) +
    choices.filter((choice) => choice.value !== choice.options[0]?.value).length +
    amountFilters.filter((filter) => parseAmount(amountOf(filter.key).text) !== null).length +
    dateFilters.filter((filter) => spanOf(filter.key).from !== "" || spanOf(filter.key).to !== "").length;
  const query = search.trim().length >= MIN_SEARCH_LENGTH ? search.trim().toLocaleLowerCase("bs") : "";

  const rows = useMemo(() => {
    const filtered = allRows.filter(
      (row) =>
        filters.every((filter) => {
          const values = selected[filter.key];
          const matches = filter.matches;
          return !matches || !values || values.size === 0 || [...values].some((value) => matches(row, value));
        }) &&
        amountFilters.every((filter) => compareAmount(filter.value(row), amountOf(filter.key))) &&
        dateFilters.every((filter) => {
          const { from, to } = spanOf(filter.key);
          const day = filter.value(row).slice(0, 10);
          return (from === "" || day >= from) && (to === "" || day <= to);
        }) &&
        (!query || searchText(row).some((text) => text.toLocaleLowerCase("bs").includes(query))),
    );
    const field = sort && sortFields.find((candidate) => candidate.value === sort.field);
    if (!sort || !field) return filtered;
    const direction = sort.direction === "asc" ? 1 : -1;
    const empty = (row: T) => (field.isEmpty?.(row) ? 1 : 0);
    return [...filtered].sort((a, b) => empty(a) - empty(b) || direction * field.compare(a, b));
  }, [allRows, filters, selected, query, searchText, sort, sortFields, amountFilters, dateFilters, amounts, spans]);

  const [first] = filters;
  const firstSelected = first ? selected[first.key] : new Set<string>();
  const setGroup = (key: string, values: Set<string>) => setSelected({ ...selected, [key]: values });
  const clearFilters = () => {
    setSelected(Object.fromEntries(filters.map((filter) => [filter.key, new Set<string>()])));
    for (const choice of choices) if (choice.value !== choice.options[0]?.value) choice.onChange(choice.options[0].value);
    setAmounts({});
    setSpans({});
  };
  // Picking a field keeps the direction, and picking a direction keeps the field.
  const sortBy = (field: string) => setSort({ field, direction: sort?.direction ?? "asc" });
  const sortDirection = (direction: string) =>
    setSort({ field: sort?.field ?? sortFields[0]?.value ?? "", direction: direction === "desc" ? "desc" : "asc" });

  return (
    <>
      <Table
        title={title}
        description={typeof description === "function" ? description(rows) : description}
        columns={columns}
        rows={rows}
        getRowKey={getRowKey}
        getRowHref={getRowHref}
        emptyText={query ? "Nema rezultata za ovu pretragu." : filterCount > 0 ? "Nema rezultata za odabrane filtere." : emptyText}
        fill={fill}
        bare={bare}
        className={className}
        // A new sort from the dialog resets the column headers' own sort.
        key={`${sort?.field ?? "default"}-${sort?.direction ?? ""}`}
        action={
          <>
            {buttons.map((label, index) => (
              <button
                key={label}
                type="button"
                className={`mr-1 hidden h-8 items-center rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] xl:inline-flex ${
                  index === 0 ? "bg-[#3B9DF8] text-white hover:bg-blue-500" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}
            <label className="relative flex h-8 w-36 items-center sm:w-44">
              <LuSearch aria-hidden className="pointer-events-none absolute left-2.5 size-4 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                aria-label={searchLabel}
                placeholder="Pretraži (min. 3 znaka)"
                className="h-full w-full rounded-lg border border-slate-200 bg-white/70 pl-8 pr-2 text-xs text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#3B9DF8] focus:ring-2 focus:ring-[#3B9DF8]/15"
              />
            </label>
            {first && quick && (
              <ToolbarSelect
                label={quick.label}
                value={firstSelected.size === 0 ? "all" : firstSelected.size === 1 ? [...firstSelected][0] : "several"}
                options={[
                  { value: "all", label: quick.allLabel },
                  ...first.options.map((option) => ({
                    value: option.value,
                    label: (
                      <>
                        {option.tone && <span aria-hidden className={`size-1.5 shrink-0 rounded-full ${dots[option.tone]}`} />}
                        {option.label}
                      </>
                    ),
                  })),
                ]}
                fallback={quick.several(firstSelected.size)}
                active={firstSelected.size > 0}
                onChange={(value) => setGroup(first.key, new Set(value === "all" ? [] : [value]))}
              />
            )}
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              aria-label="Sortiraj"
              title="Sortiraj"
              className={`${iconButton} ${sort ? "text-[#3B9DF8]" : "text-gray-500"}`}
            >
              <LuArrowDownUp aria-hidden className="size-4" />
            </button>
            {/* The sheet's button shows only when the sheet holds more than the quick dropdown already does. */}
            {(filters.length > (first && quick ? 1 : 0) || choices.length > 0 || amountFilters.length > 0 || dateFilters.length > 0) && (
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                aria-label={filterCount > 0 ? `Filteri, ${filterCount} odabrano` : "Filteri"}
                title="Filteri"
                className={`${iconButton} ${filterCount > 0 ? "text-[#3B9DF8]" : "text-gray-500"}`}
              >
                <LuListFilter aria-hidden className="size-4" />
                {filterCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#3B9DF8] text-[10px] font-semibold text-white ring-2 ring-white"
                  >
                    {filterCount}
                  </span>
                )}
              </button>
            )}
          </>
        }
      />
      <Sheet
        open={filterOpen}
        title="Filteri"
        description={`Prikazano ${formatBroj(rows.length)} od ${formatBroj(total ?? allRows.length)} ${noun}`}
        onClose={() => setFilterOpen(false)}
        footer={
          <button
            type="button"
            onClick={clearFilters}
            disabled={filterCount === 0}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] disabled:pointer-events-none disabled:opacity-40"
          >
            Očisti filtere
          </button>
        }
      >
        {/* Filters choose in dropdowns; radio buttons belong to the sort sheet. */}
        {choices.map((choice) => (
          <SelectGroup key={choice.key} legend={choice.legend} options={choice.options} value={choice.value} onChange={choice.onChange} />
        ))}
        {filters.map((filter) => (
          <FilterGroup
            key={filter.key}
            legend={filter.legend}
            options={filter.options.map((option) => ({
              ...option,
              count: option.count ?? allRows.filter((row) => filter.matches?.(row, option.value) ?? true).length,
            }))}
            selected={selected[filter.key] ?? new Set()}
            onToggle={(value) => setGroup(filter.key, toggled(selected[filter.key] ?? new Set(), value))}
          />
        ))}
        {amountFilters.map((filter) => (
          <AmountGroup
            key={filter.key}
            legend={filter.legend}
            unit={filter.unit}
            value={amountOf(filter.key)}
            onChange={(value) => setAmounts((current) => ({ ...current, [filter.key]: value }))}
          />
        ))}
        {dateFilters.map((filter) => (
          <DateGroup
            key={filter.key}
            legend={filter.legend}
            value={spanOf(filter.key)}
            onChange={(value) => setSpans((current) => ({ ...current, [filter.key]: value }))}
          />
        ))}
      </Sheet>
      <Sheet
        open={sortOpen}
        title="Sortiranje"
        description={sort ? `${sortFields.find((field) => field.value === sort.field)?.label ?? ""} · ${sort.direction === "asc" ? "rastuće" : "opadajuće"}` : "Zadani redoslijed"}
        onClose={() => setSortOpen(false)}
        footer={
          <button
            type="button"
            onClick={() => setSort(null)}
            disabled={!sort}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B9DF8] disabled:pointer-events-none disabled:opacity-40"
          >
            Vrati zadani redoslijed
          </button>
        }
      >
        <ChoiceGroup
          legend="Polje"
          options={sortFields.map(({ value, label }) => ({ value, label }))}
          value={sort?.field ?? ""}
          onChange={sortBy}
        />
        <ChoiceGroup legend="Smjer" options={DIRECTIONS} value={sort?.direction ?? ""} onChange={sortDirection} />
      </Sheet>
    </>
  );
}
