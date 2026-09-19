import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AiSearch from "@/components/shared/AiSearch";
import UploadIcon from "@/components/shared/UploadIcon";
import { RequestSteps } from "@/components/shared/RequestSteps";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { Rial } from "@/components/shared/Rial";
import { ArrowRight, FileCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { nextRequestNo, REQUEST_REJECTED, REQUEST_STATUS_CHIP } from "../requestFlow";
import { useBonuses } from "@/lib/bonuses/context";
import { formatDate } from "../loanData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYMENT_SOURCES, DEFAULT_BANK } from "../payrollData";
import {
  BONUS_EXPENSE_TYPE,
  BONUS_CATEGORY,
  BONUS_SUBCATEGORIES,
  BONUS_DISBURSED,
  BONUS_STATUS_CHIP,
  OTHER_BONUS,
  bonusDate,
  bonusReason,
  bonusesFor,
} from "../bonusData";

const NOTES_LIMIT = 300;

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  subcategory: "",
  bonusType: "",
  amount: "",
  notes: "",
});

/** How the bonus actually reached the employee, once it is paid out. */
const emptyPayment = () => ({
  method: "",
  bank: DEFAULT_BANK,
  accountNo: "",
  paidOn: todayIso(),
  reference: "",
});

/** A label with its required mark, so the asterisk is coloured everywhere. */
function FieldLabel({ htmlFor, required, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
    </Label>
  );
}

/** A fact the disbursement reads back rather than asks for again. */
function Locked({ id, label, value, highlight }) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className={cn(
          "cursor-default bg-locked text-muted-foreground",
          highlight && "border-green-600/40 font-semibold text-green-700"
        )}
      />
    </div>
  );
}

/**
 * How the bonus actually reached the employee.
 *
 * The figure is not asked for again: it is what the first stage settled, and
 * a typed one could disagree with the bonus it pays.
 */
function BonusDisbursement({
  employee,
  reason,
  amount: figure,
  payment,
  onChange,
  receipt,
  onReceipt,
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <Locked id="bonus-pay-employee" label="Employee" value={employee} />
      <Locked id="bonus-pay-reason" label="Bonus Type" value={reason} />
      <Locked
        id="bonus-pay-amount"
        label="Bonus Amount (OMR)"
        value={figure}
        highlight
      />

      <div className="space-y-2">
        <FieldLabel htmlFor="bonus-pay-method" required>
          Payment Method
        </FieldLabel>
        <Select
          value={payment.method}
          onValueChange={(value) => value && onChange("method", value)}
        >
          <SelectTrigger id="bonus-pay-method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="bonus-pay-bank">Bank</FieldLabel>
        <Select
          value={payment.bank}
          onValueChange={(value) => value && onChange("bank", value)}
        >
          <SelectTrigger id="bonus-pay-bank">
            <SelectValue placeholder="Select bank or cash" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_SOURCES.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="bonus-pay-account">Account No.</FieldLabel>
        <Input
          id="bonus-pay-account"
          value={payment.accountNo}
          onChange={(e) => onChange("accountNo", e.target.value)}
          placeholder="Enter the account the bonus goes to"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="bonus-pay-date" required>
          Payment Date
        </FieldLabel>
        <Input
          id="bonus-pay-date"
          type="date"
          value={payment.paidOn}
          onChange={(e) => onChange("paidOn", e.target.value)}
        />
      </div>

      {/* What the bank called the payment, and the proof of it - on the same
          row as the rest of the transfer. */}
      <div className="space-y-2">
        <FieldLabel htmlFor="bonus-pay-reference">Payment Reference</FieldLabel>
        <div className="flex w-full min-w-0 items-center gap-2">
          <Input
            id="bonus-pay-reference"
            className="min-w-0 flex-1"
            value={payment.reference}
            onChange={(e) => onChange("reference", e.target.value)}
            placeholder="TRX-0000-00000"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            asChild
            title={receipt ? receipt.name + " attached" : "Attach payment receipt"}
            className={cn("shrink-0", receipt && "border-green-600 text-green-600")}
          >
            <label htmlFor="bonus-pay-receipt" className="cursor-pointer">
              {receipt ? (
                <FileCheck className="h-4 w-4" />
              ) : (
                <UploadIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Attach payment receipt</span>
            </label>
          </Button>
          <Input
            id="bonus-pay-receipt"
            type="file"
            className="hidden"
            onChange={(e) => e.target.files[0] && onReceipt(e.target.files[0])}
          />
        </div>
      </div>

    </div>
  );
}

/**
 * The bonuses paid to one employee, and the form that records another.
 *
 * A bonus is the firm's decision rather than a request, so it is entered the
 * way it happened: what it was for, how much, and the day it was paid. Every
 * one is booked to Employee Expenses under Bonus, which is shown rather than
 * asked for.
 */
export default function BonusSection({
  employee,
  adding,
  onCloseAdd,
  // Opening a request from the list puts the section back into adding, so
  // the window over the page is the one that shows it.
  onOpenAdd,
  // The words on the button that opens the form, over the list it adds to.
  addLabel = "Add Bonus",
}) {
  const { bonuses, addBonus, updateBonus } = useBonuses();
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  // Which half of the bonus is open - what it is, and then how it was paid -
  // and the bonus that has been entered and is now waiting to be paid.
  const [stage, setStage] = useState("entry");
  const [openId, setOpenId] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [receipt, setReceipt] = useState(null);
  // Refusing asks for a reason before it takes one.
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const open = bonuses.find((bonus) => bonus.id === openId) || null;
  const settled = open?.status === BONUS_DISBURSED;
  const refused = open?.status === REQUEST_REJECTED;

  const mine = smartSearch(bonusesFor(bonuses, employee?.name), query);
  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));
  const isOther = draft.subcategory === OTHER_BONUS;

  const canSave =
    draft.subcategory &&
    (!isOther || draft.bonusType.trim()) &&
    Number(draft.amount) > 0;

  const canPay = canSave && payment.method && payment.paidOn;

  const close = () => {
    setDraft(emptyDraft());
    setPayment(emptyPayment());
    setReceipt(null);
    setStage("entry");
    setOpenId(null);
    setRejecting(false);
    setReason("");
    onCloseAdd();
  };

  /**
   * The bonus entered. Deciding it is not paying it, so it is on record
   * waiting for the disbursement that the next stage records.
   */
  const save = () => {
    if (!canSave) return;
    const details = {
      subcategory: draft.subcategory,
      bonusType: isOther ? draft.bonusType.trim() : "",
      amount: Number(draft.amount),
      notes: draft.notes.trim(),
    };

    if (open) {
      updateBonus(open.id, details);
    } else {
      const id = bonuses.reduce((max, bonus) => Math.max(max, bonus.id), 0) + 1;
      addBonus({
        employee: employee.name,
        expenseType: BONUS_EXPENSE_TYPE,
        category: BONUS_CATEGORY,
        // On the list straight away, under a temporary number, waiting on the
        // disbursement that settles it.
        requestNo: nextRequestNo(bonuses),
        recordedOn: todayIso(),
        paidOn: "",
        ...details,
      });
      setOpenId(id);
    }
    setStage("disbursement");
  };

  /** Paid out: the bonus is disbursed, and says how. */
  const disburse = () => {
    if (!canPay || !openId) return;
    updateBonus(openId, {
      status: BONUS_DISBURSED,
      rejectionReason: "",
      method: payment.method,
      bank: payment.bank,
      accountNo: payment.accountNo,
      paidOn: payment.paidOn,
      reference: payment.reference.trim(),
      receipt: receipt?.name || "",
    });
    close();
  };

  /** Refused: the bonus keeps its temporary number and says why. */
  const reject = () => {
    if (!openId || !reason.trim()) return;
    updateBonus(openId, {
      status: REQUEST_REJECTED,
      rejectionReason: reason.trim(),
    });
    close();
  };

  /** A request opened back off the list, to be followed or decided. */
  const track = (bonus) => {
    setOpenId(bonus.id);
    setStage("disbursement");
    setRejecting(false);
    setReason("");
    setReceipt(null);
    setDraft({
      subcategory: bonus.subcategory,
      bonusType: bonus.bonusType || "",
      amount: String(bonus.amount),
      notes: bonus.notes || "",
    });
    setPayment({
      ...emptyPayment(),
      method: bonus.method || "",
      bank: bonus.bank || DEFAULT_BANK,
      accountNo: bonus.accountNo || "",
      paidOn: bonus.paidOn || todayIso(),
      reference: bonus.reference || "",
    });
    onOpenAdd?.();
  };

  // The form opens over the page rather than pushing it down: the list it is
  // filed into stays where it was, behind it.
  const form = (
      <div className="space-y-6">
        {/* The two halves of a bonus: what it is for, and then how it was
            paid out. Either header opens its own half. */}
        <RequestSteps
          active={stage}
          onChange={setStage}
          steps={[
            {
              key: "entry",
              title: "Data Entry",
              note: "Enter exceptional bonus details",
              done: Boolean(canSave),
            },
            {
              key: "disbursement",
              title: "Disbursement",
              note: "Payment and bank transfer details",
              done: Boolean(canPay),
              // Nothing can be paid out until there is a bonus to pay.
              disabled: !canSave,
            },
          ]}
        />

        {/* The stage's own heading. On the first one the bonus names itself:
            what it is for is the heading over what it comes to. */}
        <h3 className="text-base font-semibold text-primary">
          {stage === "disbursement"
            ? "Disbursement"
            : draft.subcategory || "Data Entry"}
        </h3>

        {stage === "disbursement" ? (
          <>
            <BonusDisbursement
              employee={employee?.name || ""}
              reason={draft.subcategory}
              // The label already says OMR, so the figure does not.
              amount={amountValue(Number(draft.amount))}
              payment={payment}
              onChange={setPay}
              receipt={receipt}
              onReceipt={setReceipt}
            />

            {/* A refused bonus says why, and stays as it is. */}
            {refused && (
              <div className="space-y-2">
                <FieldLabel htmlFor="bonus-refused">
                  Reason for Rejection
                </FieldLabel>
                <Textarea
                  id="bonus-refused"
                  readOnly
                  tabIndex={-1}
                  rows={2}
                  className="cursor-default border-destructive/40 bg-destructive/5 text-destructive"
                  value={open?.rejectionReason || ""}
                />
              </div>
            )}

            {rejecting && (
              <div className="space-y-2">
                <FieldLabel htmlFor="bonus-reason" required>
                  Reason for Rejection
                </FieldLabel>
                <Textarea
                  id="bonus-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Say why this bonus is refused"
                />
              </div>
            )}
          </>
        ) : (
        <>
          {/* Every field the same width: nothing here takes more room than
              the rest, so the row reads as one set of boxes. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {/* Where the money comes from is not a choice: a bonus is booked
                to Employee Expenses under Bonus, always. It is shown so the
                record says what it was charged to. */}
            <div className="space-y-2">
              <FieldLabel htmlFor="bonus-expense-type">Expense Type</FieldLabel>
              <Input
                id="bonus-expense-type"
                value={BONUS_EXPENSE_TYPE}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-locked text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="bonus-category">Category</FieldLabel>
              <Input
                id="bonus-category"
                value={BONUS_CATEGORY}
                readOnly
                tabIndex={-1}
                className="cursor-default bg-locked text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="bonus-subcategory" required>
                Subcategory
              </FieldLabel>
              <Select
                value={draft.subcategory}
                onValueChange={(value) => value && set("subcategory", value)}
              >
                <SelectTrigger id="bonus-subcategory">
                  <SelectValue placeholder="Select Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {BONUS_SUBCATEGORIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Only where the list does not already say what the bonus was
                for, and next to the choice that asked the question. */}
            {isOther && (
              <div className="space-y-2">
                <FieldLabel htmlFor="bonus-type" required>
                  Bonus Type
                </FieldLabel>
                <Input
                  id="bonus-type"
                  value={draft.bonusType}
                  onChange={(e) => set("bonusType", e.target.value)}
                  placeholder="Say what the bonus was for"
                  autoComplete="off"
                />
              </div>
            )}

            <div className="space-y-2">
              <FieldLabel htmlFor="bonus-amount" required>
                Bonus Amount (<Rial />)
              </FieldLabel>
              <Input
                id="bonus-amount"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <FieldLabel htmlFor="bonus-notes">Reason / Notes</FieldLabel>
              <Textarea
                id="bonus-notes"
                rows={4}
                maxLength={NOTES_LIMIT}
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Anything worth recording about this bonus..."
              />
              <p className="text-right text-xs text-muted-foreground">
                {draft.notes.length} / {NOTES_LIMIT}
              </p>
            </div>
          </div>
        </>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {/* A plain button: this form sits inside the employee form. */}
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>

          {/* A bonus already paid out is only being looked at. */}
          {stage === "disbursement" && !settled && !refused && (
            rejecting ? (
              <Button
                type="button"
                variant="destructive"
                onClick={reject}
                disabled={!reason.trim()}
              >
                Confirm Rejection
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setRejecting(true)}
              >
                Reject Request
              </Button>
            )
          )}

          {stage === "disbursement" ? (
            !refused && (
              <Button
                type="button"
                onClick={disburse}
                disabled={!canPay || rejecting}
              >
                Confirm Disbursement
              </Button>
            )
          ) : (
            <Button type="button" onClick={save} disabled={!canSave}>
              Save and Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Opened over the page, so the list it is filed into stays behind. */}
        <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && close()}>
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {open
                  ? "Bonus " + (open.requestNo || "")
                  : "Add Bonus"}
              </DialogTitle>
            </DialogHeader>
            {form}
          </DialogContent>
        </Dialog>

        {/* The search on the left, where every list in the system has it,
            and the way to add on the right. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AiSearch
            value={query}
            onChange={setQuery}
            placeholder="Ask about bonuses..."
          />
          {addLabel && !adding && (
            <Button type="button" className="ml-auto" onClick={onOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              {addLabel}
            </Button>
          )}
        </div>

        {mine.length === 0 ? (
          <EmptyState>No bonus has been paid to this employee yet.</EmptyState>
        ) : (
          <RecordTable minWidth={900}>
            <HeadRow>
              <Th width="6%">No.</Th>
              <Th width="14%">Bonus Date</Th>
              <Th width="26%">Bonus Details</Th>
              {/* The unit is said once, in the heading, so the figures under
                  it can be read against each other. */}
              <Th width="16%" className="text-right">
                Bonus Amount (OMR)
              </Th>
              <Th width="16%">Status</Th>
              <Th width="22%">Notes</Th>
            </HeadRow>
            <tbody>
              {mine.map((bonus, index) => (
                <Row key={bonus.id}>
                  {/* A bonus waiting on a decision carries its temporary
                      number and opens back into the form; one already paid
                      out simply takes its place in the run. */}
                  <Td className="whitespace-nowrap font-medium text-primary">
                    {bonus.status === BONUS_DISBURSED ? (
                      index + 1
                    ) : (
                      <button
                        type="button"
                        onClick={() => track(bonus)}
                        className="rounded font-bold text-primary underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {bonus.requestNo || index + 1}
                      </button>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-primary">
                    {formatDate(bonusDate(bonus))}
                  </Td>
                  <Td className="text-left">
                    <span className="block font-semibold text-primary">
                      {bonusReason(bonus)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {bonus.expenseType} &rarr; {bonus.category}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-right font-bold text-green-700">
                    {amountValue(bonus.amount)}
                  </Td>
                  <Td className="text-center">
                    <span
                      className={cn(
                        "inline-block rounded-md px-3 py-1 text-xs font-semibold",
                        BONUS_STATUS_CHIP[bonus.status] ||
                          REQUEST_STATUS_CHIP[bonus.status]
                      )}
                    >
                      {bonus.status}
                    </span>
                  </Td>
                  <Td className="text-left text-muted-foreground">
                    {bonus.notes || "-"}
                  </Td>
                </Row>
              ))}
            </tbody>
          </RecordTable>
        )}
      </CardContent>
    </Card>
  );
}
