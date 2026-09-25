import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import FormHeading from "@/components/shared/FormHeading";
import AiSearch from "@/components/shared/AiSearch";
import TabBar from "@/components/shared/TabBar";
import { Plus, Eye, EyeOff } from "lucide-react";
import { withRial } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  nextRequestNo,
  REQUEST_PENDING,
  REQUEST_REJECTED,
  REQUEST_STATUS_CHIP,
} from "../requestFlow";
import { formatDate } from "@/pages/firm/firmData";
import {
  commissionRecords,
  commissionsFor,
  feesFor,
  commissionOn,
  nextCommissionNo,
} from "@/pages/firm/commissionData";
import CommissionForm from "@/pages/firm/sections/CommissionForm";
import { useClients } from "@/lib/clients/context";

import SalariesSection from "./SalariesSection";
import BonusSection from "./BonusSection";
import LoansSection from "./LoansSection";
import AssistanceSection from "./AssistanceSection";
import { BENEFIT_TABS } from "./benefitTabs";

/** A commission that has been paid is settled; anything else is a request. */
const COMMISSION_PAID = "Paid";

const COMMISSION_STATUS_CHIP = {
  ...REQUEST_STATUS_CHIP,
  [COMMISSION_PAID]: "bg-green-100 text-green-800",
};

/** The day the commission was recorded, however far back it goes. */
const commissionDate = (record) =>
  record.date || record.periodFrom
    ? formatDate(record.date || record.periodFrom)
    : "-";

const money = (amount) =>
  withRial(
    Number(amount || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );

/**
 * The commission agreed with this employee, read from the firm's records.
 *
 * The same form the firm's own commission page uses opens above the list -
 * with one difference: the person it is paid to is this employee, so the two
 * questions about who it is for are answered before it opens.
 */
function CommissionTab({ employee, adding, onCloseAdd, onOpenAdd, canDecide = true }) {
  const { clients } = useClients();
  const [records, setRecords] = useState(() => commissionsFor(employee.name));
  // The commission on the list the form is open on, if any.
  const [openId, setOpenId] = useState(null);
  const open = records.find((record) => record.id === openId) || null;

  // The client chosen on the open form, if any. While a commission is being
  // written for a client, the list shows only what is already agreed with that
  // client - which is what the new one has to be judged against.
  const [clientFilter, setClientFilter] = useState("");
  const [query, setQuery] = useState("");

  const filtering = adding && Boolean(clientFilter);
  const clientName =
    clients.find((client) => client.clientNo === clientFilter)?.clientName ||
    "";
  const shown = filtering
    ? records.filter((record) => record.clientNo === clientFilter)
    : records;
  const found = smartSearch(shown, query);

  /** Closing the form, by either button, puts the whole list back. */
  const close = () => {
    setClientFilter("");
    setOpenId(null);
    onCloseAdd();
  };

  /**
   * What was agreed, on the list straight away under a temporary number and
   * waiting on the payment that settles it.
   */
  const submit = (record) => {
    if (openId) {
      setRecords((prev) =>
        prev.map((row) => (row.id === openId ? { ...row, ...record } : row))
      );
      return;
    }
    const id = records.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    setRecords((prev) => [
      {
        ...record,
        id,
        requestNo: nextRequestNo(prev),
        commissionNo: "",
        status: REQUEST_PENDING,
        date: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setOpenId(id);
  };

  /** Paid: the commission takes the list's own number and is settled. */
  const save = (record) => {
    if (!canDecide) return;
    setRecords((prev) =>
      prev.map((row) =>
        row.id === openId
          ? {
              ...row,
              ...record,
              commissionNo:
                row.commissionNo || nextCommissionNo(commissionRecords.concat(prev)),
              status: COMMISSION_PAID,
              rejectionReason: "",
            }
          : row
      )
    );
    close();
  };

  /** Refused: the commission keeps its temporary number and says why. */
  const reject = (why) => {
    if (!canDecide) return;
    setRecords((prev) =>
      prev.map((row) =>
        row.id === openId
          ? { ...row, status: REQUEST_REJECTED, rejectionReason: why }
          : row
      )
    );
    close();
  };

  /** A commission opened back off the list, to be followed or decided. */
  const track = (record) => {
    setOpenId(record.id);
    onOpenAdd?.();
  };

  return (
    <div className="space-y-6">
      {/* Opened over the page, so the list it is filed into stays behind. */}
      <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {open
                ? "Commission " + (open.commissionNo || open.requestNo || "")
                : "Add Commission"}
            </DialogTitle>
          </DialogHeader>
          <CommissionForm
            canAnswer={canDecide}
            key={openId || "new"}
            employee={employee}
            initial={open}
            commissionNo={
              open?.commissionNo ||
              nextCommissionNo(commissionRecords.concat(records))
            }
            onCancel={close}
            onSubmit={submit}
            onSave={save}
            onReject={reject}
            onClientChange={setClientFilter}
          />
        </DialogContent>
      </Dialog>

      {filtering && (
        <p className="text-sm text-muted-foreground">
          Showing commissions for{" "}
          <span className="font-semibold text-primary">{clientName}</span>{" "}
          only
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* The search on the left, where every list in the system has it,
              and the name of the list on the right. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <AiSearch
              value={query}
              onChange={setQuery}
              placeholder="Ask about commission..."
            />
            {!adding && (
              <Button variant="outline" type="button" className="ms-auto" onClick={onOpenAdd}>
                <Plus className="me-2 h-4 w-4" />
                Add Commission
              </Button>
            )}
          </div>

          {found.length === 0 ? (
            <EmptyState>
              {filtering
                ? "No commission has been agreed with this employee on " +
                  clientName +
                  " yet."
                : "No commission has been agreed with this employee."}
            </EmptyState>
          ) : (
            <RecordTable minWidth={1080}>
              <HeadRow>
                <Th width="13%">Commission No.</Th>
                <Th width="13%">Commission Date</Th>
                <Th width="18%">Client Name</Th>
                <Th width="18%">Payee</Th>
                <Th width="24%">Legal Fees &amp; Commission</Th>
                <Th width="18%">Notes</Th>
              </HeadRow>
              <tbody>
                {found.map((record) => (
                  <Row key={record.id}>
                    {/* A commission waiting on payment carries its temporary
                        number and opens back into the form. */}
                    <Td className="whitespace-nowrap font-medium text-primary">
                      {record.commissionNo ? (
                        record.commissionNo
                      ) : (
                        <button
                          type="button"
                          onClick={() => track(record)}
                          className="rounded font-bold text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {record.requestNo}
                        </button>
                      )}

                      {/* Where it stands, under the number it belongs to. */}
                      <span
                        className={cn(
                          "mt-1 block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold",
                          COMMISSION_STATUS_CHIP[record.status || COMMISSION_PAID]
                        )}
                      >
                        {record.status || COMMISSION_PAID}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-primary">
                      {commissionDate(record)}
                    </Td>
                    <Td className="text-start">{record.clientName}</Td>
                    <Td className="text-start">{record.paidTo}</Td>

                    {/* What it was worked out from, then what it came to:
                        the fees before VAT, the rate, and the commission. */}
                    <Td className="text-start">
                      <span className="block">
                        <span className="text-muted-foreground">
                          Before VAT:{" "}
                        </span>
                        {money(feesFor(record))}
                      </span>
                      <span className="block">
                        <span className="text-muted-foreground">
                          Commission:{" "}
                        </span>
                        {record.rate}%
                      </span>
                      <span className="block font-bold text-green-700">
                        <span className="font-normal text-muted-foreground">
                          Paid Commission:{" "}
                        </span>
                        {money(commissionOn(record))}
                      </span>
                    </Td>

                    <Td className="text-start text-muted-foreground">
                      {record.notes || "-"}
                    </Td>
                  </Row>
                ))}
              </tbody>
            </RecordTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Everything the firm pays one employee, on one page.
 *
 * Salary, loans, assistance and commission were four entries in the menu, all
 * answering the same question - what this person is owed and why. They are one
 * page with four tabs instead. The tabs themselves sit in the corner of the
 * section's heading, which is where the choice of tab belongs; this page shows
 * whichever one is open. Each tab's Add button opens its form at the top of
 * that tab rather than at the top of the page: the form belongs to the records
 * underneath it, not to the whole employee.
 */
export default function FinancialBenefitsSection({
  employee,
  onSaveSalary,
  tab,
  onTabChange,
  // The firm sets what it pays; on My Profile the figures are only read.
  canEdit = true,
}) {
  // Which tab's form is open, if any.
  const [adding, setAdding] = useState(null);

  // Moving to another tab closes what was open on the last one. A form left
  // open would still be open on the way back, over records it was never
  // started from.
  const [openTab, setOpenTab] = useState(tab);
  if (openTab !== tab) {
    setOpenTab(tab);
    setAdding(null);
  }

  // The salary breakdown is what the Salaries tab is: opening the tab shows
  // what the employee is paid, with the history of payments under it.

  // My Profile shows what the employee is paid. What the office keeps its own
  // record of - the bonuses it decided on - is not shown there at all, so the
  // tab itself goes, and with it any chance of landing on a tab that is gone.
  const tabs = canEdit
    ? BENEFIT_TABS
    : BENEFIT_TABS.filter((option) => !option.office);

  const current = tabs.find((option) => option.key === tab) || tabs[0];
  const open = current.key;

  // Salary and commission are what the firm decides to pay; a loan and
  // assistance are what the employee asks for. So on My Profile the first two
  // are only read, and the other two can still be asked for.
  //
  // Salary has a second button that belongs to the other page: the employee
  // cannot record their own pay, but they can ask for part of it in advance,
  // and the firm never asks for that on their behalf.
  const firmDecides = open === "salaries" || open === "commission";
  const addLabel = canEdit
    ? current.add
    : current.selfAdd || (firmDecides ? "" : current.add);
  const showsAdd = Boolean(addLabel);

  // One heading at a time: a form that opens with its own heading - and its
  // own way back - takes this row's place instead of sitting under it.
  // Commission's form has no heading of its own, and neither have the stepped
  // salary and loan forms, which open under the tabs; so those rows stay.
  const inlineForm =
    open === "commission" ||
    open === "loans" ||
    open === "assistance" ||
    open === "bonus" ||
    (open === "salaries" && canEdit);
  const formHasHeading = adding === open && !inlineForm;

  return (
    <div className="space-y-6">
      {/* One row for the whole section: the open tab's name on the left, and
          on the right the tabs and the buttons that act on what is open. A
          heading above the tabs would only name the tab that is already
          highlighted. */}
      {!formHasHeading && (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormHeading title={current.label} note={current.note} icon={current.icon} />

        {/* ms-auto keeps the tabs at the logical end even when they wrap onto a
            line of their own: a wrapped line is laid out on its own, so
            justify-between above would otherwise drop them back to the left. */}
        {/* No Add up here: every list carries it on the row above its own
            table, opposite the search. */}
        <div className="ms-auto">
          <TabBar options={tabs} value={open} onChange={onTabChange} />
        </div>
      </div>
      )}

      {open === "salaries" && (
        <SalariesSection
          employee={employee}
          adding={adding === "salaries"}
          onCloseAdd={() => setAdding(null)}
          onOpenAdd={() => setAdding("salaries")}
          onSave={onSaveSalary}
          addLabel={showsAdd ? addLabel : ""}
          canEdit={canEdit}
          advance={!canEdit}
        />
      )}

      {open === "bonus" && (
        <BonusSection
          employee={employee}
          adding={adding === "bonus"}
          onCloseAdd={() => setAdding(null)}
          onOpenAdd={() => setAdding("bonus")}
          addLabel={showsAdd ? addLabel : ""}
          canDecide={canEdit}
        />
      )}

      {open === "loans" && (
        <LoansSection
          employee={employee}
          adding={adding === "loans"}
          onCloseAdd={() => setAdding(null)}
          onOpenAdd={() => setAdding("loans")}
          addLabel={showsAdd ? addLabel : ""}
          canDecide={canEdit}
        />
      )}

      {open === "assistance" && (
        <AssistanceSection
          employee={employee}
          adding={adding === "assistance"}
          onCloseAdd={() => setAdding(null)}
          onOpenAdd={() => setAdding("assistance")}
          addLabel={showsAdd ? addLabel : ""}
          canDecide={canEdit}
        />
      )}

      {open === "commission" && (
        <CommissionTab
          employee={employee}
          adding={adding === "commission"}
          onCloseAdd={() => setAdding(null)}
          onOpenAdd={() => setAdding("commission")}
          canDecide={canEdit}
        />
      )}
    </div>
  );
}