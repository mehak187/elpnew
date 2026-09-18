import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/panels";
import AiSearch from "@/components/shared/AiSearch";
import FormHeading from "@/components/shared/FormHeading";
import TabBar from "@/components/shared/TabBar";
import { Plus, FileText } from "lucide-react";
import { ENTITLEMENT_TABS } from "../entitlementTabs";

/**
 * What the firm owes an employee beyond their salary.
 *
 * Nine lists in one page rather than nine entries in the menu: an allowance
 * and an end-of-service payment answer the same question - what this person is
 * entitled to and why - and the tab says which of them is open.
 */
export default function EntitlementsSection({
  employee,
  // The firm decides what it pays; on My Profile the entitlements are read.
  canEdit = true,
}) {
  const [tab, setTab] = useState(ENTITLEMENT_TABS[0].key);
  const [query, setQuery] = useState("");

  const current = ENTITLEMENT_TABS.find((option) => option.key === tab);

  return (
    <div className="space-y-6">
      {/* One row for the whole section: its name on the left, and the tabs
          that say which entitlement is open on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FormHeading
          icon={FileText}
          title="Employee Entitlements"
          note="Manage employee allowances and end-of-service entitlements"
        />
        <div className="ml-auto">
          <TabBar options={ENTITLEMENT_TABS} value={tab} onChange={setTab} />
        </div>
      </div>

      {/* What is searched, and the way to add to it. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AiSearch
          value={query}
          onChange={setQuery}
          placeholder="Search..."
        />
        {canEdit && (
          <Button type="button" className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Entitlement
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <EmptyState>
            No {current.label.toLowerCase()} has been recorded for{" "}
            {employee?.name || "this employee"}.
          </EmptyState>
        </CardContent>
      </Card>
    </div>
  );
}
