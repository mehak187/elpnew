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
import FormHeading from "@/components/shared/FormHeading";
import Panel from "@/components/shared/Panel";
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
import { Gift, ClipboardList } from "lucide-react";
import { useBonuses } from "@/lib/bonuses/context";
import { amount, formatDate } from "../loanData";
import {
  BONUS_EXPENSE_TYPE,
  BONUS_CATEGORY,
  BONUS_SUBCATEGORIES,
  OTHER_BONUS,
  bonusReason,
  bonusesFor,
} from "../bonusData";

const NOTES_LIMIT = 300;

const todayIso = () => new Date().toISOString().slice(0, 10);

const emptyDraft = () => ({
  subcategory: "",
  bonusType: "",
  amount: "",
  paidOn: todayIso(),
  notes: "",
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

/**
 * The bonuses paid to one employee, and the form that records another.
 *
 * A bonus is the firm's decision rather than a request, so it is entered the
 * way it happened: what it was for, how much, and the day it was paid. Every
 * one is booked to Employee Expenses under Bonus, which is shown rather than
 * asked for.
 */
export default function BonusSection({ employee, adding, onCloseAdd }) {
  const { bonuses, addBonus } = useBonuses();
  const [draft, setDraft] = useState(emptyDraft);

  const mine = bonusesFor(bonuses, employee?.name);
  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));
  const isOther = draft.subcategory === OTHER_BONUS;

  const canSave =
    draft.subcategory &&
    (!isOther || draft.bonusType.trim()) &&
    Number(draft.amount) > 0 &&
    draft.paidOn;

  const close = () => {
    setDraft(emptyDraft());
    onCloseAdd();
  };

  const save = () => {
    if (!canSave) return;
    addBonus({
      employee: employee.name,
      expenseType: BONUS_EXPENSE_TYPE,
      category: BONUS_CATEGORY,
      subcategory: draft.subcategory,
      bonusType: isOther ? draft.bonusType.trim() : "",
      amount: Number(draft.amount),
      paidOn: draft.paidOn,
      notes: draft.notes.trim(),
    });
    close();
  };

  // Adding takes over the section: the list is what has already been paid, and
  // none of it helps while another bonus is being entered.
  if (adding) {
    return (
      <div className="space-y-6">
        <FormHeading
          icon={Gift}
          title="Add Bonus"
          note="Record a bonus paid to this employee."
          onBack={close}
        />

        <Panel title="Bonus Information" icon={Gift}>
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

            <div className="space-y-2">
              <FieldLabel htmlFor="bonus-paid-on" required>
                Payment Date
              </FieldLabel>
              <Input
                id="bonus-paid-on"
                type="date"
                max={todayIso()}
                value={draft.paidOn}
                onChange={(e) => set("paidOn", e.target.value)}
              />
            </div>
          </div>
        </Panel>

        <Panel title="Bonus Details" icon={ClipboardList}>
          <div className="space-y-2">
            <FieldLabel htmlFor="bonus-notes">Notes</FieldLabel>
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
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
          {/* A plain button: this form sits inside the employee form. */}
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={!canSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        {mine.length === 0 ? (
          <EmptyState>No bonus has been paid to this employee yet.</EmptyState>
        ) : (
          <RecordTable minWidth={860}>
            <HeadRow>
              <Th width="6%">No.</Th>
              <Th width="14%">Payment Date</Th>
              <Th width="30%" note="Category / Reason">
                Bonus Details
              </Th>
              <Th width="16%">
                Bonus Amount (<Rial />)
              </Th>
              <Th width="34%">Notes</Th>
            </HeadRow>
            <tbody>
              {mine.map((bonus, index) => (
                <Row key={bonus.id}>
                  <Td className="font-medium text-primary">{index + 1}</Td>
                  <Td className="whitespace-nowrap text-primary">
                    {formatDate(bonus.paidOn)}
                  </Td>
                  <Td className="text-left">
                    <span className="block font-semibold text-primary">
                      {bonusReason(bonus)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {bonus.expenseType} · {bonus.category}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap font-bold text-green-700">
                    {amount(bonus.amount)}
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
