import { Fragment, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Home,
  List,
  MoreHorizontal,
  PieChart,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FilterPanel from "@/components/shared/FilterPanel";
import ExcelIcon from "@/components/shared/ExcelIcon";
import { filterChips, withoutChip } from "@/lib/filterChips";
import { smartSearch } from "@/lib/search/smartSearch";
import { toCsv, downloadCsv } from "@/lib/csv";
import { amountValue } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  INSTALLMENT_STATUS_TONE,
  LOAN_APPROVED,
  formatDate,
  loanTotal,
  scheduleRows,
} from "../loanData";

/** How each standing of a loan is marked. */
const LOAN_CHIP = {
  Active: "bg-green-100 text-green-800",
  Completed: "bg-slate-200 text-slate-700",
  Pending: "bg-amber-100 text-amber-800",
  Rejected: "bg-red-100 text-red-800",
  Cancelled: "bg-slate-100 text-slate-600",
};

const LOAN_DOT = {
  Active: "bg-green-600",
  Completed: "bg-slate-400",
  Pending: "bg-amber-500",
  Rejected: "bg-red-600",
  Cancelled: "bg-slate-400",
};

/**
 * Each loan as the lists show it: its name in the run (Loan 1 is the first
 * taken), its number, what it comes to, what has been paid and is left, when
 * it runs, and how it stands - Active while anything is owed on a granted
 * loan, Completed once nothing is. Read off the schedule, so no two lists
 * can disagree about the same loan.
 */
export function describeLoans(records) {
  // Oldest first is how they are numbered.
  return [...records]
    .sort((a, b) =>
      String(a.disbursementDate || a.firstDue).localeCompare(String(b.disbursementDate || b.firstDue)) ||
      a.id - b.id
    )
    .map((record, index) => {
      const total = loanTotal(record);
      const rows = scheduleRows(total, record.monthly, record.firstDue, record.payments);
      const paid = rows.reduce((sum, row) => sum + row.paid, 0);
      const granted = record.status === LOAN_APPROVED;
      const remaining = Math.max(total - paid, 0);
      return {
        record,
        id: record.id,
        name: "Loan " + (index + 1),
        number: record.requestNo || "LNR-" + String(record.id).padStart(3, "0"),
        total,
        paid,
        remaining,
        monthly: Number(record.monthly || 0),
        start: record.disbursementDate || record.firstDue || "",
        end: rows.length ? rows[rows.length - 1].due : "",
        status: granted ? (remaining <= 0 ? "Completed" : "Active") : record.status,
        installments: rows,
        granted,
      };
    });
}

/**
 * One employee's loans as the design lays them out: what they come to across
 * the top, then every loan with its installments folded under it.
 *
 * A granted loan is Active while anything is still owed on it and Completed
 * once nothing is; a request keeps the standing it was given. Every figure is
 * read off the schedule, so the tiles and the rows cannot disagree.
 */
export default function LoanLedger({ records, onOpen, onAdd, addLabel = "Request New Loan" }) {
  const [chosen, setChosen] = useState("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [pageSize, setPageSize] = useState(10);
  // Which loans are unfolded: the first, to begin with.
  const [open, setOpen] = useState({});

  const loans = describeLoans(records);

  // The figures across the top, over the loans actually granted.
  const granted = loans.filter((loan) => loan.granted);
  const sum = (list, key) => list.reduce((total, loan) => total + loan[key], 0);
  const tiles = [
    { label: "Total Loans", value: loans.length, icon: Database, tone: "bg-blue-50 text-blue-600", box: "bg-blue-50/50" },
    { label: "Total Loan Amount", value: sum(granted, "total"), money: true, icon: Wallet, tone: "bg-emerald-50 text-emerald-600", box: "bg-emerald-50/50" },
    { label: "Total Deducted", value: sum(granted, "paid"), money: true, icon: PieChart, tone: "bg-violet-50 text-violet-600", box: "bg-violet-50/50" },
    { label: "Total Remaining", value: sum(granted, "remaining"), money: true, icon: FileText, tone: "bg-orange-50 text-orange-500", box: "bg-orange-50/50", ink: "text-orange-600" },
    {
      label: "Monthly Deduction",
      value: sum(granted.filter((loan) => loan.status === "Active"), "monthly"),
      money: true,
      icon: CalendarDays,
      tone: "bg-teal-50 text-teal-600",
      box: "bg-teal-50/50",
      ink: "text-teal-700",
    },
  ];

  const statusField = {
    key: "status",
    label: "Status",
    type: "radio",
    options: [
      { value: "all", label: "All" },
      ...[...new Set(loans.map((loan) => loan.status))].map((value) => ({ value, label: value })),
    ],
  };
  const fields = [statusField];

  const shown = smartSearch(
    loans
      .filter((loan) => chosen === "all" || String(loan.id) === chosen)
      .filter((loan) => !filters.status || filters.status === "all" || loan.status === filters.status)
      .map((loan) => ({ ...loan, searchText: [loan.name, loan.number, loan.status].join(" ") })),
    query
  ).slice(0, pageSize);

  const isOpen = (loan, index) => (loan.id in open ? open[loan.id] : index === 0);

  const exportColumns = [
    { key: "name", header: "Loan" },
    { key: "number", header: "Loan No." },
    { key: "total", header: "Loan Amount (OMR)" },
    { key: "paid", header: "Paid Amount (OMR)" },
    { key: "remaining", header: "Remaining Balance (OMR)" },
    { key: "monthly", header: "Monthly Installment (OMR)" },
    { key: "start", header: "Start Date" },
    { key: "end", header: "End Date" },
    { key: "status", header: "Status" },
  ];

  return (
    <div className="space-y-4">
      {/* Where the list is, what it is, and the way to ask for another. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-primary/60">
            <Home className="size-4" aria-hidden="true" />
            <span>Financial Requests</span>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span aria-current="page" className="text-primary">Loans</span>
          </nav>
          <h2 className="text-2xl font-bold text-primary">Loans</h2>
          <p className="text-sm text-primary/75">View your loans, installments and remaining balances.</p>
        </div>
        {onAdd && (
          <Button type="button" variant="add" onClick={onAdd}>
            <Plus className="me-2 h-4 w-4" />
            {addLabel}
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", tile.box)}>
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", tile.tone)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-primary/75">{tile.label}</p>
                <p className={cn("text-xl font-bold", tile.ink || "text-primary")}>
                  {tile.money ? amountValue(tile.value, 0) : tile.value}
                  {tile.money && <span className="ms-1 text-sm font-semibold">OMR</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Which loan, what to look for, how it is narrowed, the download and
            how many to a page. */}
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <Select value={chosen} onValueChange={(value) => value && setChosen(value)}>
            <SelectTrigger className="w-48" aria-label="Loan">
              <List className="me-2 size-4 shrink-0" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loans ({loans.length})</SelectItem>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={String(loan.id)}>
                  <span className="flex w-full items-center gap-2">
                    <span className={cn("size-2 rounded-full", LOAN_DOT[loan.status])} aria-hidden="true" />
                    {loan.name}
                    <span className={cn("ms-auto rounded px-1.5 text-[10px] font-semibold", LOAN_CHIP[loan.status])}>
                      {loan.status}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search loans, installments..."
              className="ps-9"
            />
          </div>
          <FilterPanel fields={fields} value={filters} onChange={setFilters} />
          <Button
            type="button"
            variant="outline"
            onClick={() => downloadCsv(toCsv(exportColumns, shown), "loans.csv")}
          >
            <ExcelIcon className="me-2 size-5" />
            Export
          </Button>
          <Select value={String(pageSize)} onValueChange={(value) => value && setPageSize(Number(value))}>
            <SelectTrigger className="w-24" aria-label="Loans per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["10", "25", "50"].map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filterChips(fields, filters).length > 0 && (
          <div className="flex flex-wrap gap-2 border-b px-3 py-2">
            {filterChips(fields, filters).map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => setFilters(withoutChip(filters, chip))}
                className="rounded-full bg-muted px-3 py-1 text-xs text-primary"
              >
                {chip.label}: {chip.value} ✕
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-table-head text-xs font-semibold text-primary">
              <tr>
                <th className="px-4 py-3 text-start">Loan</th>
                <th className="px-4 py-3 text-end">Loan Amount (OMR)</th>
                <th className="px-4 py-3 text-end">Paid Amount (OMR)</th>
                <th className="px-4 py-3 text-end">Remaining Balance (OMR)</th>
                <th className="px-4 py-3 text-end">Monthly Installment (OMR)</th>
                <th className="px-4 py-3 text-start">Start Date</th>
                <th className="px-4 py-3 text-start">End Date</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    No loans to show.
                  </td>
                </tr>
              )}
              {shown.map((loan, index) => {
                const unfolded = isOpen(loan, index);
                return (
                  <Fragment key={loan.id}>
                    {/* The loan itself. */}
                    <tr className="border-t bg-table-head/40">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setOpen((prev) => ({ ...prev, [loan.id]: !unfolded }))}
                          aria-expanded={unfolded}
                          className="flex items-center gap-2 rounded font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronDown
                            className={cn("size-4 transition-transform", !unfolded && "-rotate-90")}
                            aria-hidden="true"
                          />
                          {loan.name}
                          <span className="font-normal text-primary/70">| {loan.number}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-end font-semibold text-primary">{amountValue(loan.total)}</td>
                      <td className="px-4 py-3 text-end font-semibold text-primary">{amountValue(loan.paid)}</td>
                      <td className="px-4 py-3 text-end font-semibold text-primary">{amountValue(loan.remaining)}</td>
                      <td className="px-4 py-3 text-end text-primary">{amountValue(loan.monthly)}</td>
                      <td className="px-4 py-3 text-primary">{loan.start ? formatDate(loan.start) : "-"}</td>
                      <td className="px-4 py-3 text-primary">{loan.end ? formatDate(loan.end) : "-"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-semibold", LOAN_CHIP[loan.status])}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="rounded p-1 text-primary hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MoreHorizontal className="size-5" aria-hidden="true" />
                              <span className="sr-only">Actions for {loan.name}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setOpen((prev) => ({ ...prev, [loan.id]: !unfolded }))}>
                              {unfolded ? "Hide installments" : "Show installments"}
                            </DropdownMenuItem>
                            {onOpen && (
                              <DropdownMenuItem onSelect={() => onOpen(loan.record)}>Open request</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>

                    {/* Its installments, folded under it. */}
                    {unfolded && loan.installments.length > 0 && (
                      <tr className="border-t">
                        <td colSpan={9} className="px-4 pb-3 pt-2">
                          <div className="flex items-center gap-2 pb-2 text-sm font-semibold text-primary">
                            {loan.name}
                            <span className="font-normal text-primary/70">| {loan.number}</span>
                            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", LOAN_CHIP[loan.status])}>
                              {loan.status}
                            </span>
                          </div>
                          <table className="w-full text-xs">
                            <thead className="text-primary/70">
                              <tr>
                                <th className="w-16 px-2 py-1.5 text-start font-medium">No.</th>
                                <th className="px-2 py-1.5 text-start font-medium">Due Date</th>
                                <th className="px-2 py-1.5 text-end font-medium">Installment Amount (OMR)</th>
                                <th className="px-2 py-1.5 text-end font-medium">Paid Amount (OMR)</th>
                                <th className="px-2 py-1.5 text-end font-medium">Remaining Balance (OMR)</th>
                                <th className="px-2 py-1.5 text-start font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loan.installments.map((row) => (
                                <tr key={row.no} className="border-t border-dashed">
                                  <td className="px-2 py-1.5 text-primary/70">
                                    {loan.name.replace("Loan ", "")}.{row.no}
                                  </td>
                                  <td className="px-2 py-1.5 text-primary">{formatDate(row.due)}</td>
                                  <td className="px-2 py-1.5 text-end text-primary">{amountValue(row.installment)}</td>
                                  <td className="px-2 py-1.5 text-end text-primary">{amountValue(row.paid)}</td>
                                  <td className="px-2 py-1.5 text-end text-primary">{amountValue(row.remaining)}</td>
                                  <td className="px-2 py-1.5">
                                    <span className={cn("rounded px-2 py-0.5 font-semibold", INSTALLMENT_STATUS_TONE[row.status])}>
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * The loans already granted, as the loan request shows them before a new one
 * is asked for: what each was, what is left on it and when it ends, with its
 * installments a click away - and what is owed across all of them.
 */
export function ExistingLoans({ records }) {
  const [open, setOpen] = useState({});
  const loans = describeLoans(records).filter((loan) => loan.granted);
  const active = loans.filter((loan) => loan.status === "Active");
  const outstanding = loans.reduce((total, loan) => total + loan.remaining, 0);

  return (
    <section className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-primary">
          <FileText className="size-6" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-primary">Your Existing Loans ({loans.length})</h3>
          <p className="text-sm text-primary/75">
            You currently have {active.length} active loan{active.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-blue-50/60 px-4 py-2">
          <Database className="size-6 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs text-primary/75">Total Outstanding Loans</p>
            <p className="text-xl font-bold text-primary">
              {amountValue(outstanding)} <span className="text-sm font-normal text-primary/70">OMR</span>
            </p>
          </div>
        </div>
      </div>

      {loans.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          No loans have been granted yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-table-head text-xs font-semibold text-primary">
              <tr>
                <th className="w-8 px-3 py-2.5" />
                <th className="px-3 py-2.5 text-start">Loan No.</th>
                <th className="px-3 py-2.5 text-start">Original Amount (OMR)</th>
                <th className="px-3 py-2.5 text-start">Remaining Balance (OMR)</th>
                <th className="px-3 py-2.5 text-start">Monthly Installment (OMR)</th>
                <th className="px-3 py-2.5 text-start">Start Date</th>
                <th className="px-3 py-2.5 text-start">End Date</th>
                <th className="px-3 py-2.5 text-start">Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <Fragment key={loan.id}>
                  <tr className="border-t">
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen((prev) => ({ ...prev, [loan.id]: !prev[loan.id] }))}
                        aria-expanded={Boolean(open[loan.id])}
                        className="rounded p-0.5 text-primary hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChevronRight
                          className={cn("size-4 transition-transform", open[loan.id] && "rotate-90")}
                          aria-hidden="true"
                        />
                        <span className="sr-only">Installments of {loan.name}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-primary">
                      {loan.name}
                      <span className="px-2 font-normal text-primary/40">|</span>
                      <span className="font-normal">{loan.number}</span>
                    </td>
                    <td className="px-3 py-2.5 text-primary">{amountValue(loan.total)}</td>
                    <td className="px-3 py-2.5 text-primary">{amountValue(loan.remaining)}</td>
                    <td className="px-3 py-2.5 text-primary">{amountValue(loan.monthly)}</td>
                    <td className="px-3 py-2.5 text-primary">{loan.start ? formatDate(loan.start) : "-"}</td>
                    <td className="px-3 py-2.5 text-primary">{loan.end ? formatDate(loan.end) : "-"}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-md px-2.5 py-0.5 text-xs font-semibold", LOAN_CHIP[loan.status])}>
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                  {open[loan.id] &&
                    loan.installments.map((row) => (
                      <tr key={row.no} className="border-t border-dashed bg-table-head/30 text-xs">
                        <td />
                        <td className="px-3 py-1.5 text-primary/70">
                          {loan.name.replace("Loan ", "")}.{row.no} · {formatDate(row.due)}
                        </td>
                        <td className="px-3 py-1.5 text-primary">{amountValue(row.installment)}</td>
                        <td className="px-3 py-1.5 text-primary">{amountValue(row.remaining)}</td>
                        <td className="px-3 py-1.5 text-primary">Paid {amountValue(row.paid)}</td>
                        <td colSpan={2} />
                        <td className="px-3 py-1.5">
                          <span className={cn("rounded px-2 py-0.5 font-semibold", INSTALLMENT_STATUS_TONE[row.status])}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
