import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AiSearch from "@/components/shared/AiSearch";
import { RequestSteps } from "@/components/shared/RequestSteps";
import { Card, CardContent } from "@/components/ui/card";
import { Bordered, EmptyState } from "@/components/shared/panels";
import {
  FieldLabel,
  Settled,
  Said,
  Choice,
  Attach,
} from "@/components/shared/formFields";
import {
  RecordTable,
  HeadRow,
  Th,
  Row,
  Td,
} from "@/components/shared/RecordTable";
import { Rial } from "@/components/shared/Rial";
import { FileText, History, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { amountValue } from "@/lib/money";
import { smartSearch } from "@/lib/search/smartSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REQUEST_REJECTED, REQUEST_STATUS_CHIP } from "../requestFlow";
import { useBonuses } from "@/lib/bonuses/context";
import { formatDate } from "../loanData";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import { PAYING_ACCOUNTS } from "@/pages/firm/firmData";
import {
  BONUS_BOOKING,
  BONUS_EXPENSE_TYPE,
  BONUS_CATEGORY,
  BONUS_SUBCATEGORIES,
  BONUS_DISBURSED,
  BONUS_STATUS_CHIP,
  OTHER_BONUS,
  bonusDate,
  bonusReason,
  bonusesFor,
  nextBonusNo,
} from "../bonusData";

const COMMENT_LIMIT = 500;

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  subcategory: "",
  bonusType: "",
  amount: "",
  bonusDate: todayIso(),
  comment: "",
});

/** How the bonus actually reaches the employee, once it is granted. */
const emptyPayment = () => ({
  ...BONUS_BOOKING,
  method: "",
  bankAccount: "",
  paidOn: todayIso(),
  reference: "",
});

/**
 * The bonuses one employee has asked for, and what became of each.
 *
 * A bonus is asked for the way everything else in this section is: the
 * employee writes the request, it goes on the list under its own number
 * waiting on a decision, and management answers it - granting what was asked
 * for, granting less, or refusing it and saying why. Every one is booked to
 * Employee Expenses under Bonus, which is shown rather than asked for.
 */
export default function BonusSection({
  employee,
  adding,
  onCloseAdd,
  // Opening a request from the list puts the section back into adding, so
  // the window over the page is the one that shows it.
  onOpenAdd,
  // The words on the button that opens the form, over the list it adds to.
  addLabel = "Bonus Request",
}) {
  const { bonuses, addBonus, updateBonus } = useBonuses();
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  // Which half of the bonus is open - what is being asked for, and then how
  // it was paid out - and the request the form is open on.
  const [stage, setStage] = useState("request");
  const [openId, setOpenId] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [payment, setPayment] = useState(emptyPayment);
  const [receipt, setReceipt] = useState(null);

  const open = bonuses.find((bonus) => bonus.id === openId) || null;
  const settled = open?.status === BONUS_DISBURSED;
  const refused = open?.status === REQUEST_REJECTED;

  const mine = smartSearch(bonusesFor(bonuses, employee?.name), query);
  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));

  const isOther = draft.subcategory === OTHER_BONUS;
  const requestNo = open?.requestNo || nextBonusNo(bonuses);
  const requestedOn = open ? bonusDate(open) : todayIso();
  const attachedName = attachment?.name || open?.attachment || "";
  // What the bonus is called, which is also what it is filed under.
  const bonusName = isOther ? draft.bonusType.trim() : draft.subcategory;

  const requested = Number(draft.amount) || 0;

  const canSubmit = draft.subcategory && (!isOther || draft.bonusType.trim()) && requested > 0;

  // Nothing is paid out until the transfer says where it went and what the
  // bank called it.
  const canPay =
    Boolean(open) &&
    payment.method &&
    payment.bankAccount &&
    payment.paidOn &&
    payment.reference.trim();

  const close = () => {
    setDraft(emptyDraft());
    setPayment(emptyPayment());
    setReceipt(null);
    setAttachment(null);
    setStage("request");
    setOpenId(null);
    onCloseAdd();
  };

  /**
   * The bonus asked for. It goes on the list straight away, under its own
   * number and waiting on a decision.
   */
  const submit = () => {
    if (!canSubmit) return;
    const details = {
      subcategory: draft.subcategory,
      bonusType: isOther ? draft.bonusType.trim() : "",
      amount: requested,
      notes: draft.comment.trim(),
      attachment: attachment?.name || "",
    };

    if (open) {
      updateBonus(open.id, details);
    } else {
      addBonus({
        employee: employee?.name || "",
        ...BONUS_BOOKING,
        requestNo,
        recordedOn: requestedOn,
        paidOn: "",
        ...details,
      });
    }
    close();
  };

  /** Paid out: the bonus is disbursed, and the record says how. */
  const disburse = () => {
    if (!canPay || !open) return;
    updateBonus(open.id, {
      status: BONUS_DISBURSED,
      rejectionReason: "",
      method: payment.method,
      bankAccount: payment.bankAccount,
      paidOn: payment.paidOn,
      reference: payment.reference.trim(),
      receipt: receipt?.name || "",
    });
    close();
  };

  /** A request opened back off the list, to be followed or decided. */
  const track = (bonus) => {
    setOpenId(bonus.id);
    setStage("disbursement");
    setAttachment(null);
    setReceipt(null);
    setDraft({
      subcategory: bonus.subcategory,
      bonusType: bonus.bonusType || "",
      amount: String(bonus.amount),
      bonusDate: bonusDate(bonus),
      comment: bonus.notes || "",
    });
    setPayment({
      ...emptyPayment(),
      method: bonus.method || "",
      bankAccount: bonus.bankAccount || "",
      paidOn: bonus.paidOn || todayIso(),
      reference: bonus.reference || "",
    });
    onOpenAdd?.();
  };

  // Who is asking, and under what number. None of it is typed: it is the
  // employee's own record and the register's next number.
  const requestInformation = (
    <Bordered title="Request Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <div className="flex h-full flex-col justify-end gap-2">
          <FieldLabel htmlFor="bonus-no">Request No.</FieldLabel>
          <div className="flex w-full min-w-0 items-center gap-2">
            <Input
              id="bonus-no"
              readOnly
              tabIndex={-1}
              value={requestNo}
              className="min-w-0 flex-1 cursor-default bg-locked text-muted-foreground"
            />
            <Attach
              file={attachment}
              onPick={setAttachment}
              label="supporting document"
            />
          </div>
          {/* Whatever was attached hangs under the number it belongs to
              rather than taking a field of its own. */}
          {!attachment && attachedName && (
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-primary no-underline hover:text-primary/70"
              title={"Open " + attachedName}
            >
              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
              {attachedName}
            </button>
          )}
        </div>

        <Settled
          id="bonus-request-date"
          label="Request Date"
          value={formatDate(requestedOn)}
        />
        <Settled
          id="bonus-employee"
          label="Employee Name"
          value={employee?.name || ""}
        />
        <Settled
          id="bonus-emp-no"
          label="Employee No."
          value={employee?.empNo || ""}
        />
      </div>
    </Bordered>
  );

  // The form opens over the page rather than pushing it down: the list it is
  // filed into stays where it was, behind it.
  const form = (
    <div className="space-y-6">
      {/* The two halves of a bonus: what is being asked for, and then how
          it was paid out. Either header opens its own half. */}
      <RequestSteps
        active={stage}
        onChange={setStage}
        steps={[
          {
            key: "request",
            title: "Bonus Request",
            // The note says where the half stands, so a finished one does
            // not still read as an instruction.
            note: canSubmit
              ? "Bonus details completed"
              : "Enter bonus request details",
            done: Boolean(canSubmit),
          },
          {
            key: "disbursement",
            title: "Bonus Disbursement",
            note: "Payment and transfer details",
            done: Boolean(open?.paidOn),
            // Nothing can be paid out until there is a bonus to pay: a new
            // request is saved first, and opened back off the list.
            disabled: !open,
          },
        ]}
      />

      {stage === "disbursement" ? (
        <>
          {/* What is being paid, read off the request rather than asked for
              again. */}
          <Bordered title="Bonus Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Settled id="bonus-no-said" label="Bonus No." value={requestNo} />
              <Settled
                id="bonus-date-said"
                label="Bonus Date"
                value={formatDate(draft.bonusDate)}
              />
              <Settled
                id="bonus-employee-said"
                label="Employee Name"
                value={employee?.name || ""}
              />
              <Settled
                id="bonus-amount-said"
                label="Bonus Amount"
                value={amountValue(requested)}
                payable
              />
            </div>
          </Bordered>

          {/* Where it is booked, and how it actually leaves. */}
          <Bordered title="Expense & Disbursement Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Settled
                id="bonus-expense-type"
                label="Expense Type"
                value={BONUS_EXPENSE_TYPE}
              />
              <Settled
                id="bonus-category"
                label="Category"
                value={BONUS_CATEGORY}
              />
              <Settled
                id="bonus-subcategory"
                label="Subcategory"
                value={bonusName}
              />

              <Choice
                id="bonus-method"
                label="Payment Method"
                value={payment.method}
                onChange={(value) => value && setPay("method", value)}
                placeholder="Select method"
                options={PAYMENT_METHODS}
              />

              {/* One choice, not two: the account carries the bank it is
                  held at, so they cannot be set to disagree. */}
              <Choice
                id="bonus-bank"
                label="Bank Account"
                value={payment.bankAccount}
                onChange={(value) => value && setPay("bankAccount", value)}
                placeholder="Select bank account"
                options={PAYING_ACCOUNTS}
              />

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="bonus-paid-on" required>
                  Payment Date
                </FieldLabel>
                <Input
                  id="bonus-paid-on"
                  type="date"
                  value={payment.paidOn}
                  onChange={(e) => setPay("paidOn", e.target.value)}
                />
              </div>

              {/* What the bank called the transfer, and the proof of it. */}
              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="bonus-reference" required>
                  Transfer No.
                </FieldLabel>
                <div className="flex w-full min-w-0 items-center gap-2">
                  <Input
                    id="bonus-reference"
                    className="min-w-0 flex-1"
                    value={payment.reference}
                    onChange={(e) => setPay("reference", e.target.value)}
                    placeholder="TRX-0000-00000"
                  />
                  <Attach
                    file={receipt}
                    onPick={setReceipt}
                    label="transfer receipt"
                  />
                </div>
              </div>

              {/* The figure being transferred is the one the request settled
                  on, so it is shown rather than typed again. */}
              <Settled
                id="bonus-to-disburse"
                label="Amount to Disburse"
                value={amountValue(requested)}
                payable
              />
            </div>
          </Bordered>

          {/* Who is being paid and where it lands, in one line to be read
              against the transfer above before it is confirmed. */}
          <div className="rounded-lg border border-green-600/40 bg-green-50/50 p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold text-green-700">
              <span
                aria-hidden="true"
                className="h-5 w-1 shrink-0 rounded-full bg-green-600"
              />
              Employee &amp; Transfer Summary
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
              <Said label="Employee No." value={employee?.empNo || ""} />
              <Said label="Employee Name" value={employee?.name || ""} />
              <Said label="Bank Account" value={payment.bankAccount} />
              <Said
                label="Transfer Amount"
                value={amountValue(requested)}
                settled
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {requestInformation}

          <Bordered title="Bonus Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Choice
                id="bonus-subcategory-pick"
                label="Bonus Type"
                value={draft.subcategory}
                onChange={(value) => value && set("subcategory", value)}
                placeholder="Select Bonus Type"
                options={BONUS_SUBCATEGORIES}
              />

              {/* Only where the list does not already say what the bonus is
                  for, and next to the choice that asked the question. */}
              {isOther && (
                <div className="flex h-full flex-col justify-end gap-2">
                  <FieldLabel htmlFor="bonus-other-type" required>
                    Say What For
                  </FieldLabel>
                  <Input
                    id="bonus-other-type"
                    value={draft.bonusType}
                    onChange={(e) => set("bonusType", e.target.value)}
                    placeholder="Say what the bonus is for"
                    autoComplete="off"
                  />
                </div>
              )}

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="bonus-date">Bonus Date</FieldLabel>
                <Input
                  id="bonus-date"
                  type="date"
                  value={draft.bonusDate}
                  onChange={(e) => set("bonusDate", e.target.value)}
                />
              </div>

              <div className="flex h-full flex-col justify-end gap-2">
                <FieldLabel htmlFor="bonus-amount" required>
                  Requested Bonus Amount (<Rial />)
                </FieldLabel>
                <Input
                  id="bonus-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => set("amount", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0.000"
                />
              </div>
            </div>
          </Bordered>

          <Bordered title="Employee Comment">
            <div className="space-y-2">
              <Textarea
                id="bonus-comment"
                rows={4}
                maxLength={COMMENT_LIMIT}
                value={draft.comment}
                onChange={(e) => set("comment", e.target.value)}
                placeholder="Explain the reason and basis for requesting this bonus"
              />
              <p className="text-right text-xs text-muted-foreground">
                {draft.comment.length} / {COMMENT_LIMIT}
              </p>
            </div>
          </Bordered>
        </>
      )}

      {/* Plain buttons: this form sits inside the employee form, which either
          would otherwise submit. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        {/* What has been paid before is the list behind this form - offered
            where a payment is being made, not where one is being asked for. */}
        {stage === "disbursement" && (
          <Button type="button" variant="ghost" onClick={close}>
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          {stage === "disbursement" ? (
            <Button
              type="button"
              onClick={disburse}
              disabled={!canPay || settled || refused}
            >
              Save
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={!canSubmit}>
              Save
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Opened over the page, so the list it is filed into stays behind. */}
        <Dialog open={Boolean(adding)} onOpenChange={(o) => !o && close()}>
          <DialogContent className="max-h-[90vh] w-[92vw] max-w-7xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {stage === "disbursement" ? "Bonus Disbursement" : "Bonus Request"}
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
          <EmptyState>No bonus has been asked for yet.</EmptyState>
        ) : (
          <RecordTable minWidth={900}>
            <HeadRow>
              <Th width="12%">Request No.</Th>
              <Th width="14%">Bonus Date</Th>
              <Th width="28%">Bonus Details</Th>
              {/* The unit is said once, in the heading, so the figures under
                  it can be read against each other. */}
              <Th width="18%" className="text-right">
                Bonus Amount (OMR)
              </Th>
              <Th width="28%">Employee Comment</Th>
            </HeadRow>
            <tbody>
              {mine.map((bonus) => (
                <Row key={bonus.id}>
                  {/* Clicking the number opens the request back up. Where it
                      stands is said under the number rather than in a column
                      of its own. */}
                  <Td className="whitespace-nowrap font-medium text-primary">
                    <button
                      type="button"
                      onClick={() => track(bonus)}
                      className="font-medium text-primary no-underline hover:text-primary/70"
                    >
                      {bonus.requestNo}
                    </button>
                    <span
                      className={cn(
                        "mt-1 block w-fit rounded-md px-2.5 py-0.5 text-xs font-semibold",
                        BONUS_STATUS_CHIP[bonus.status] ||
                          REQUEST_STATUS_CHIP[bonus.status]
                      )}
                    >
                      {bonus.status}
                    </span>
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
