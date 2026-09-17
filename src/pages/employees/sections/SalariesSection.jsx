import {
  useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { Button } from "@/components/ui/button";
import { RequestSteps } from "@/components/shared/RequestSteps";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  } from "@/components/ui/select";
import SalaryHistory from "./SalaryHistory";
import {
  AdvanceSalaryForm,
  AdvanceRequests,
} from "./AdvanceSalarySection";
import { Rial } from "@/components/shared/Rial";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Save, FileCheck } from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  ALLOWANCES,
  DEDUCTIONS,
  SALARY_MONTHS,
  MONTH_FULL,
  PAYMENT_YEARS,
  PAYMENT_SOURCES,
  DEFAULT_BANK,
  DEFAULT_BOOKING,
  salaryHistory,
  nextSalaryNo,
  totalEarnings,
  totalDeductions,
  netSalary,
  amount,
} from "../payrollData";

const PAYSLIP_KEYS = [
  "special",
  "housing",
  "transport",
  "electricity",
  "water",
  "loan",
  "administrative",
];

/** An employee record as the payslip form reads it: strings, and no blanks. */
function fromEmployee(employee) {
  const value = (key) => (employee?.[key] ? String(employee[key]) : "");
  const payslip = { basic: value("salary") };
  PAYSLIP_KEYS.forEach((key) => {
    payslip[key] = value(key);
  });
  return payslip;
}

// The three figures start as null rather than "": null means untouched, so
// they open on what the employee is actually paid and can still be cleared.
const emptyPayment = {
  ...DEFAULT_BOOKING,
  month: "",
  year: "",
  basic: null,
  allowances: null,
  deductions: null,
  method: "",
  source: DEFAULT_BANK,
  accountNo: "",
  reference: "",
  notes: "",
  paymentDate: "",
};

/** A heading over one group of the payslip. */
function Group({ title, children }) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">{title}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {children}
      </div>
      <div className="border-b" />
    </div>
  );
}

/**
 * One amount on the payslip, with the currency inside the box.
 *
 * `readOnly` marks a figure that is worked out rather than entered; `highlight`
 * marks the one figure the whole page is for.
 */
function Amount({ id, label, required, value, onChange, readOnly, highlight }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="whitespace-nowrap text-destructive">&nbsp;*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={readOnly ? "text" : "number"}
          min={readOnly ? undefined : "0"}
          step={readOnly ? undefined : "0.001"}
          readOnly={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          placeholder="0.000"
          className={cn(
            !readOnly && "pr-12",
            readOnly && "text-muted-foreground",
            readOnly && !highlight && "bg-locked",
            highlight && "border-green-600 bg-green-50 font-bold text-green-700"
          )}
          value={value}
          onChange={onChange}
        />
        {/* A figure that is typed needs the box to say what it is in; one that
            is worked out arrives with the currency already on it. */}
        {!readOnly && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Rial />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * One line of a payslip in the history: what it is, then how much.
 *
 * `tone` colours the amount and never the label, so a row can be scanned
 * down the left for what is being read and across for whether it went out
 * (red) or is what is left (green).
 */
function PayLine({ label, tone, className, children }) {
  return (
    <span className={cn("block leading-relaxed", className)}>
      <span className="font-semibold">{label}</span>{" "}
      <span className={cn("font-semibold", tone)}>{children}</span>
    </span>
  );
}

/** A booking the form does not ask about: it is what a salary is filed as. */
function Locked({ id, label, value }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        value={value}
        className="cursor-default bg-locked text-muted-foreground"
      />
    </div>
  );
}

/** A figure typed into the salary being recorded. The label says (OMR). */
function Typed({ id, label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} (<Rial />)
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        placeholder="0.000"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
      />
    </div>
  );
}

/** A settled figure inside the payment form's summary. */
function Figure({ label, value }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{label}</p>
      <div className="relative">
        <Input
          readOnly
          tabIndex={-1}
          className="bg-locked text-muted-foreground"
          value={amount(value)}
        />
      </div>
    </div>
  );
}

/** A labelled select, since the payment form is made almost entirely of them. */
function Choice({ id, label, value, onChange, placeholder, options }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) =>
            typeof option === "string" ? (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ) : (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * What an employee is paid, and the payments made against it.
 *
 * The page holds the monthly salary; the form behind "Add Salary / Bonus"
 * records one payment of it. The payment never asks for the figures again - it
 * reads them off the salary above, so a payslip and the payment that settles it
 * cannot disagree.
 */
export default function SalariesSection({
  employee,
  adding,
  onCloseAdd,
  onSave,
  // Whether the salary breakdown is open. The history under it is always shown.
  detailsOpen = true,
  // The firm sets the salary; on My Profile the payslip is only read.
  canEdit = true,
  // My Profile, where the employee cannot record a payment to themselves but
  // can ask for part of their salary in advance.
  advance = false,
}) {
  // Opened on what the employee is already paid, so the page shows the salary
  // in force rather than a blank form somebody has to fill in from memory.
  // Every salary on record, so a month entered through this form is in the
  // history below it rather than somewhere of its own.
  const [history, setHistory] = useState(salaryHistory);
  const [payslip, setPayslip] = useState(() => fromEmployee(employee));
  const [payment, setPayment] = useState(emptyPayment);
  const [receipt, setReceipt] = useState(null);
  // Which half of the salary being recorded is open: what it comes to, and
  // then how it was transferred.
  const [payStage, setPayStage] = useState("salary");

  const set = (name, value) =>
    setPayslip((prev) => ({ ...prev, [name]: value }));
  const onAmount = (name) => (e) => set(name, e.target.value);
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));

  const earnings = totalEarnings(payslip);
  const deductions = totalDeductions(payslip);
  const net = netSalary(payslip);
  const allowances = earnings - Number(payslip.basic || 0);

  // The month being recorded opens on the salary in force, and can be edited
  // where that month differed from it. Untouched (null) means the figure above.
  const entered = (key, fallback) =>
    payment[key] === null ? String(fallback) : payment[key];
  const payBasic = entered("basic", Number(payslip.basic) || 0);
  const payAllowances = entered("allowances", allowances);
  const payDeductions = entered("deductions", deductions);
  const payNet =
    Number(payBasic || 0) + Number(payAllowances || 0) - Number(payDeductions || 0);

  // The number the salary will carry, and the month it is for, as the transfer
  // stage reads them back.
  const salaryNo = nextSalaryNo(history);
  const monthNumber = SALARY_MONTHS.findIndex((m) => m.value === payment.month) + 1;
  const period = monthNumber
    ? MONTH_FULL[monthNumber - 1] + " " + payment.year
    : "";
  // The account the last salary went to, unless this one goes elsewhere.
  const lastAccount = history[history.length - 1]?.accountNo || "";
  const accountNo = payment.accountNo || lastAccount;

  const savePayslip = () => {
    if (!(Number(payslip.basic) > 0)) return;
    const saved = { salary: String(Number(payslip.basic)) };
    PAYSLIP_KEYS.forEach((key) => {
      saved[key] = Number(payslip[key]) || 0;
    });
    onSave(saved);
  };

  const closeAdd = () => {
    setPayment(emptyPayment);
    setReceipt(null);
    setPayStage("salary");
    onCloseAdd();
  };

  // What the month came to has to be settled before how it was transferred.
  const canSaveSalary = payment.month && payment.year && Number(payBasic) > 0;
  const canPay = canSaveSalary && payment.method && payment.paymentDate;

  /** The first stage saved: the transfer details are what is left to enter. */
  const saveSalary = () => {
    if (!canSaveSalary) return;
    setPayStage("transfer");
  };

  /** Confirmed: the salary is on record, and it has been transferred. */
  const savePayment = () => {
    if (!canPay) return;
    setHistory((prev) => [
      ...prev,
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        salaryNo: nextSalaryNo(prev),
        month: monthNumber,
        year: Number(payment.year),
        basic: Number(payBasic) || 0,
        allowances: Number(payAllowances) || 0,
        // What came off this month was entered as one figure, so it is the
        // whole of the deduction and none of it is a loan installment.
        loanDeducted: 0,
        administrative: Number(payDeductions) || 0,
        administrativeReason: "",
        method: payment.method,
        bank: payment.source,
        accountNo,
        reference: payment.reference.trim(),
        receipt: receipt?.name || "",
        notes: payment.notes.trim(),
        status: "Transferred",
        paymentDate: payment.paymentDate,
      },
    ]);
    closeAdd();
  };

  /* ------------------------------------------------ the payment being added */

  // On My Profile the only thing that opens here is a request for an advance:
  // an employee does not pay their own salary.
  if (adding && advance) {
    return (
      <AdvanceSalaryForm employee={employee} net={net} onClose={closeAdd} />
    );
  }

  if (adding) {
    return (
      <div className="space-y-6 rounded-lg border p-4 sm:p-6">
        {/* The two halves of recording a month's pay: what it came to, and
            then how it was transferred. Either header opens its own half. */}
        <RequestSteps
          active={payStage}
          onChange={setPayStage}
          steps={[
            {
              key: "salary",
              title: "Add Salary",
              note: "Salary calculation and period",
              done: Boolean(canSaveSalary),
            },
            {
              key: "transfer",
              title: "Salary Transfer",
              note: "Payment and bank transfer details",
              done: Boolean(canPay),
              // Nothing can be transferred until there is a figure to transfer.
              disabled: !canSaveSalary,
            },
          ]}
        />

        <h3 className="text-base font-semibold text-primary">
          {payStage === "salary" ? "Add Salary" : "Salary Transfer"}
        </h3>

        {payStage === "salary" ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {/* Where a salary lands in the accounts is not a choice: it is
                  what a salary is, and the page for bonuses is its own. */}
              <Locked id="pay-type" label="Expense Type" value={payment.expenseType} />
              <Locked id="pay-category" label="Category" value={payment.category} />
              <Locked
                id="pay-subcategory"
                label="Subcategory"
                value={payment.subcategory}
              />

              <Choice
                id="pay-month"
                label="Month"
                value={payment.month}
                onChange={(value) => value && setPay("month", value)}
                placeholder="Select month"
                options={SALARY_MONTHS}
              />

              <Choice
                id="pay-year"
                label="Year"
                value={payment.year}
                onChange={(value) => value && setPay("year", value)}
                placeholder="Select year"
                options={PAYMENT_YEARS}
              />

              {/* Opened on the salary in force, and edited only where this
                  month differed from it. */}
              <Typed
                id="pay-basic"
                label="Basic Salary"
                value={payBasic}
                onChange={(value) => setPay("basic", value)}
              />
              <Typed
                id="pay-allowances"
                label="Total Allowances"
                value={payAllowances}
                onChange={(value) => setPay("allowances", value)}
              />
              <Typed
                id="pay-deductions"
                label="Total Deductions"
                value={payDeductions}
                onChange={(value) => setPay("deductions", value)}
              />
            </div>

            {/* The one figure the whole form is for, worked out from the three
                above rather than asked for. */}
            <div className="rounded-lg border border-green-600/40 bg-green-50 p-4">
              <p className="font-semibold text-green-700">Net Salary Payable</p>
              {/* The figure arrives with the currency already on it. */}
              <p className="mt-1 text-3xl font-bold text-green-700">
                {amount(payNet)}
              </p>
              <p className="mt-1 text-sm text-green-700">
                Basic salary plus allowances minus total deductions.
              </p>
            </div>

            {/* Plain buttons: this form sits inside the employee form, which
                either would otherwise submit. */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeAdd}>
                Cancel
              </Button>
              <Button type="button" onClick={saveSalary} disabled={!canSaveSalary}>
                Save Salary
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* What is being transferred, read off the salary just saved
                rather than asked for again. */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              <Locked id="pay-no" label="Salary No." value={salaryNo} />
              <Locked id="pay-period" label="Salary Period" value={period} />
              <Locked
                id="pay-employee"
                label="Employee Name"
                value={employee?.name || ""}
              />
              <Locked
                id="pay-net"
                label="Net Salary Payable"
                value={amount(payNet)}
              />

              <Choice
                id="pay-method"
                label="Payment Method"
                value={payment.method}
                onChange={(value) => value && setPay("method", value)}
                placeholder="Select method"
                options={PAYMENT_METHODS}
              />

              <Choice
                id="pay-bank"
                label="Bank"
                value={payment.source}
                onChange={(value) => value && setPay("source", value)}
                placeholder="Select bank or cash"
                options={PAYMENT_SOURCES}
              />

              <div className="space-y-2">
                <Label htmlFor="pay-account">Account No.</Label>
                <Input
                  id="pay-account"
                  value={accountNo}
                  onChange={(e) => setPay("accountNo", e.target.value)}
                  placeholder="Enter the account the salary goes to"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay-date">
                  Payment Date
                  <span className="whitespace-nowrap text-destructive">&nbsp;*</span>
                </Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={payment.paymentDate}
                  onChange={(e) => setPay("paymentDate", e.target.value)}
                />
              </div>

              {/* The figure being transferred is the one settled on the stage
                  before, so it is shown rather than typed again. */}
              <div className="space-y-2">
                <Label htmlFor="pay-amount">
                  Transfer Amount (<Rial />)
                </Label>
                <Input
                  id="pay-amount"
                  readOnly
                  tabIndex={-1}
                  value={amount(payNet)}
                  className="cursor-default border-green-600/40 bg-green-50 font-semibold text-green-700"
                />
              </div>

              {/* What the bank called the transfer, and the proof of it: the
                  file name lives in the tooltip, so the control stays
                  icon-sized either way. */}
              <div className="space-y-2">
                <Label htmlFor="pay-reference">Payment Reference</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="pay-reference"
                    value={payment.reference}
                    onChange={(e) => setPay("reference", e.target.value)}
                    placeholder="TRX-0000-00000"
                  />
                  {receipt ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-green-600 text-green-600 hover:text-destructive"
                      title={receipt.name + " - click to remove"}
                      onClick={() => setReceipt(null)}
                    >
                      <FileCheck className="h-4 w-4" />
                      <span className="sr-only">
                        {receipt.name} attached. Remove it.
                      </span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      title="Upload transfer receipt"
                      asChild
                    >
                      <label className="cursor-pointer">
                        <UploadIcon className="h-4 w-4" />
                        <span className="sr-only">Upload transfer receipt</span>
                        <Input
                          type="file"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files[0] && setReceipt(e.target.files[0])
                          }
                        />
                      </label>
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="pay-notes">Notes</Label>
                <Textarea
                  id="pay-notes"
                  rows={3}
                  value={payment.notes}
                  onChange={(e) => setPay("notes", e.target.value)}
                  placeholder="Enter transfer notes"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayStage("salary")}
              >
                Previous
              </Button>
              <Button type="button" variant="outline" onClick={closeAdd}>
                Cancel
              </Button>
              <Button type="button" onClick={savePayment} disabled={!canPay}>
                Confirm Salary Transfer
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------- the salary itself */


  return (
    <div className="space-y-6">
      {/* The breakdown is opened and closed from beside the heading, so that
          when it is closed the history below is all there is to read. */}
      {detailsOpen && (
      <fieldset
        id="salary-details"
        disabled={!canEdit}
        className="space-y-6 rounded-lg border p-4 sm:p-6"
      >
        <Group title="Salary & Allowances">
          <Amount
            id="salary-basic"
            label="Basic Salary"
            required
            value={payslip.basic}
            onChange={onAmount("basic")}
          />
          {ALLOWANCES.map((allowance) => (
            <Amount
              key={allowance.key}
              id={"salary-" + allowance.key}
              label={allowance.label}
              value={payslip[allowance.key]}
              onChange={onAmount(allowance.key)}
            />
          ))}
        </Group>

        <Group title="Deductions">
          {DEDUCTIONS.map((deduction) => (
            <Amount
              key={deduction.key}
              id={"salary-" + deduction.key}
              label={deduction.label}
              value={payslip[deduction.key]}
              onChange={onAmount(deduction.key)}
            />
          ))}
          <Amount
            id="salary-total-deductions"
            label="Total Deductions from Salary"
            value={amount(deductions)}
            readOnly
          />
        </Group>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">
            Total Payable Amounts
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <Amount
              id="salary-earnings"
              label="Total Earnings (Salary + Allowances)"
              value={amount(earnings)}
              readOnly
            />
            <Amount
              id="salary-deductions-total"
              label="Total Deductions from Salary"
              value={amount(deductions)}
              readOnly
            />
            <Amount
              id="salary-net"
              label="Net Salary (After Deductions)"
              value={amount(net)}
              readOnly
            />
            <Amount
              id="salary-payable"
              label="Amount Payable"
              value={amount(net)}
              readOnly
              highlight
            />
          </div>
        </div>

        {/* The salary belongs to the employee, so it is saved onto the record
            rather than only feeding the payment form below - by the firm, on
            the Employees page. */}
        {canEdit && (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={savePayslip}
              disabled={!(Number(payslip.basic) > 0)}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        )}
      </fieldset>
      )}

      {/* What has been asked for out of the salary above. The firm sees its
          own record of an advance in the payments; this is the employee's. */}
      {advance && <AdvanceRequests employee={employee} />}

      {/* What has been paid, month by month */}
      <SalaryHistory history={history} />
    </div>
  );
}
