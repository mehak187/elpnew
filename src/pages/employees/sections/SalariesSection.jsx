import {
  useState } from "react";
import UploadIcon from "@/components/shared/UploadIcon";
import { Button } from "@/components/ui/button";
import FormHeading from "@/components/shared/FormHeading";
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
import { EmptyState } from "@/components/shared/panels";
import { Rial } from "@/components/shared/Rial";
import { cn } from "@/lib/utils";
import { Save,
  Users,
  ChevronsRight,
  FileCheck,
  Wallet,
} from "lucide-react";
import { PAYMENT_METHODS } from "@/pages/expenses/expenseData";
import {
  ALLOWANCES,
  DEDUCTIONS,
  PAYMENT_MONTHS,
  PAYMENT_YEARS,
  PAYMENT_SOURCES,
  DEFAULT_BANK,
  SOURCE_SHORT,
  PAYROLL_BOOKING,
  DEFAULT_BOOKING,
  entersAmount,
  hasPeriod,
  MONTH_NAMES,
  categoriesOf,
  subcategoriesOf,
  salaryRecords,
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

const emptyPayment = {
  ...DEFAULT_BOOKING,
  month: "",
  year: "",
  periodFrom: "",
  periodTo: "",
  amount: "",
  method: "",
  source: DEFAULT_BANK,
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
  // What has been recorded through this form. The monthly history beside it
  // is the payroll run; this is the list of payments entered here.
  const [, setRecords] = useState(salaryRecords);
  const [payslip, setPayslip] = useState(() => fromEmployee(employee));
  const [payment, setPayment] = useState(emptyPayment);
  const [receipt, setReceipt] = useState(null);

  const set = (name, value) =>
    setPayslip((prev) => ({ ...prev, [name]: value }));
  const onAmount = (name) => (e) => set(name, e.target.value);
  const setPay = (name, value) =>
    setPayment((prev) => ({ ...prev, [name]: value }));

  const earnings = totalEarnings(payslip);
  const deductions = totalDeductions(payslip);
  const net = netSalary(payslip);
  const allowances = earnings - Number(payslip.basic || 0);

  // A bonus and a settlement are worked out elsewhere, so they bring their
  // own figure; everything else is a month of the salary above.
  const entersOwnAmount = entersAmount(payment.subcategory);
  const showsPeriod = hasPeriod(payment.subcategory);
  // What is being asked for, so the heading of the form still names it -
  // a bonus is not a salary, and saying so is the last chance to notice the
  // wrong subcategory before it is sent.
  const requestLabel =
    entersOwnAmount && !showsPeriod
      ? payment.subcategory
      : "Salary / Bonus";

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
    onCloseAdd();
  };

  const canPay =
    payment.expenseType &&
    payment.category &&
    payment.subcategory &&
    payment.method &&
    payment.paymentDate &&
    (entersOwnAmount
      ? Number(payment.amount) > 0 &&
        (!showsPeriod || (payment.periodFrom && payment.periodTo))
      : payment.month && payment.year);

  const savePayment = () => {
    if (!canPay) return;
    // A month of salary is written down as its parts; anything else is
    // written down as the one figure it was.
    const figures = entersOwnAmount
      ? { amount: Number(payment.amount) }
      : {
          basic: Number(payslip.basic) || 0,
          allowances,
          deductions,
        };
    const [year, month] = payment.paymentDate.split("-");
    setRecords((prev) => [
      {
        id: prev.reduce((max, r) => Math.max(max, r.id), 0) + 1,
        paymentDate: payment.paymentDate,
        month: payment.month || MONTH_NAMES[Number(month) - 1],
        year: payment.year || year,
        periodFrom: payment.periodFrom,
        periodTo: payment.periodTo,
        ...figures,
        method: payment.method,
        source: payment.source,
        receipt: receipt?.name || "",
        notes: payment.subcategory,
      },
      ...prev,
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
        {/* The way back out of the form, in the same place and with the
            same mark as on every page that opens over another. */}
        <FormHeading
          icon={Wallet}
          title={"Add " + requestLabel}
          onBack={closeAdd}
        />

        {/* Where the payment lands in the accounts. Choosing at one level
            clears the levels below it, so a category can never be left
            hanging under a type it does not belong to. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="pay-type">Expense Type</Label>
            <Select
              value={payment.expenseType}
              onValueChange={(value) =>
                setPayment((prev) => ({
                  ...prev,
                  expenseType: value,
                  category: "",
                  subcategory: "",
                }))
              }
            >
              <SelectTrigger id="pay-type">
                {/* Laid out inline rather than by class: the trigger clamps
                    every span child to one line with display:-webkit-box,
                    which would beat a flex utility and stack these two. */}
                <span
                  style={{ display: "flex" }}
                  className="min-w-0 items-center gap-2"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Select expense type" />
                </span>
              </SelectTrigger>
              <SelectContent>
                {PAYROLL_BOOKING.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Choice
            id="pay-category"
            label="Category"
            value={payment.category}
            onChange={(value) =>
              setPayment((prev) => ({ ...prev, category: value, subcategory: "" }))
            }
            placeholder="Select category"
            options={categoriesOf(payment.expenseType).map((c) => c.name)}
          />

          <Choice
            id="pay-subcategory"
            label="Subcategory"
            value={payment.subcategory}
            onChange={(value) => setPay("subcategory", value)}
            placeholder="Select subcategory"
            options={subcategoriesOf(payment.expenseType, payment.category)}
          />
        </div>

        {/* A settlement is not a month's pay: it covers a span of service and
            its amount is worked out elsewhere, so it is entered rather than
            read off the payslip. */}
        {entersOwnAmount ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {showsPeriod && (
            <div className="space-y-2">
              <Label htmlFor="pay-from">Period From</Label>
              <Input
                id="pay-from"
                type="date"
                value={payment.periodFrom}
                onChange={(e) => setPay("periodFrom", e.target.value)}
              />
            </div>
            )}

            {showsPeriod && (
            <div className="space-y-2">
              <Label htmlFor="pay-to">Period To</Label>
              <Input
                id="pay-to"
                type="date"
                value={payment.periodTo}
                onChange={(e) => setPay("periodTo", e.target.value)}
              />
            </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="pay-amount" className="text-green-700">
                Net Amount Payable
              </Label>
              <div className="relative">
                <Input
                  id="pay-amount"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  className="h-14 border-green-600 pr-12 text-2xl font-bold text-green-700"
                  value={payment.amount}
                  onChange={(e) => setPay("amount", e.target.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Rial />
                </span>
              </div>
              <p className="text-sm text-green-700">
                Net amount after deductions (if any).
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* What is being paid, and what it comes to */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="mb-4 font-semibold text-primary">Amount Summary</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Figure label="Basic Salary" value={payslip.basic} />
                  <Figure label="Total Allowances" value={allowances} />
                  <Figure label="Total Deductions" value={deductions} />
                </div>
              </div>

              <ChevronsRight
                aria-hidden="true"
                className="mx-auto hidden h-6 w-6 text-muted-foreground lg:block"
              />

              <div className="rounded-lg border border-green-600/40 bg-green-50 p-4">
                <p className="mb-3 font-semibold text-green-700">
                  Net Salary Payable
                </p>
                <Input
                  readOnly
                  tabIndex={-1}
                  className="h-14 border-green-600 bg-white text-2xl font-bold text-green-700"
                  value={amount(net)}
                />
                <p className="mt-3 text-sm text-green-700">
                  Net amount after adding allowances and deducting deductions.
                </p>
              </div>
            </div>

            <div className="border-b" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <Choice
                id="pay-month"
                label="Month"
                value={payment.month}
                onChange={(value) => setPay("month", value)}
                placeholder="Select month"
                options={PAYMENT_MONTHS}
              />
              <Choice
                id="pay-year"
                label="Year"
                value={payment.year}
                onChange={(value) => setPay("year", value)}
                placeholder="Select year"
                options={PAYMENT_YEARS}
              />
            </div>
          </>
        )}

        <div className="border-b" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end sm:gap-6">
          <Choice
            id="pay-method"
            label="Payment Method"
            value={payment.method}
            onChange={(value) => setPay("method", value)}
            placeholder="Select method"
            options={PAYMENT_METHODS}
          />

          <Choice
            id="pay-bank"
            label="Bank"
            value={payment.source}
            onChange={(value) => setPay("source", value)}
            placeholder="Select bank or cash"
            options={PAYMENT_SOURCES}
          />

          <div className="space-y-2">
            <Label htmlFor="pay-date">Payment Date</Label>
            <Input
              id="pay-date"
              type="date"
              value={payment.paymentDate}
              onChange={(e) => setPay("paymentDate", e.target.value)}
            />
          </div>

          {/* The file name lives in the tooltip, so the control stays
              icon-sized either way. */}
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
              <span className="sr-only">{receipt.name} attached. Remove it.</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              title="Upload payment receipt"
              asChild
            >
              <label className="cursor-pointer">
                <UploadIcon className="h-4 w-4" />
                <span className="sr-only">Upload payment receipt</span>
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && setReceipt(e.target.files[0])}
                />
              </label>
            </Button>
          )}
        </div>

        {/* Recording a salary is not a request, so it is saved rather than
            submitted. Both buttons are plain buttons: this form sits inside
            the employee form, which either would otherwise submit. */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={closeAdd}>
            Cancel
          </Button>
          <Button type="button" onClick={savePayment} disabled={!canPay}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
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
      <SalaryHistory />
    </div>
  );
}
