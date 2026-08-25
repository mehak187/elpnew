import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/shared/panels";
import ActiveFilters from "@/components/shared/ActiveFilters";
import { useListFilter } from "@/lib/useListFilter";
import { deriveClientStatus } from "@/lib/clientStatus";
import { clientDisplayName } from "./clientRecords";
import { useClients } from "@/lib/clients/context";


/** Has this date already passed? */
const hasExpired = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
};

/** A date, with a red dot beside it once it has expired. */
function ExpiryDate({ date }) {
  if (!date) return <span className="text-xs text-muted-foreground">-</span>;
  const expired = hasExpired(date);
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs",
        expired ? "font-medium text-red-600" : "text-muted-foreground"
      )}
    >
      {date}
      {expired && (
        <>
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-red-500"
          />
          <span className="sr-only">Expired</span>
        </>
      )}
    </p>
  );
}

/**
 * The one format an uploaded document is ever shown in - the same icon and the
 * same word, wherever it appears.
 */
function DocumentLink({ url }) {
  if (!url) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className="flex items-center gap-1.5 rounded text-xs font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      Document
    </button>
  );
}

export default function ClientsList() {
  const navigate = useNavigate();
  const URL_FILTERS = {
    status: { label: "Status", match: (row, value) => row.status === value },
    type: { label: "Type", match: (row, value) => row.type === value },
  };

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const { active, apply, clear } = useListFilter(URL_FILTERS);
  const { clients } = useClients();

  // Inactive and merged clients sit at the end of the list.
  const processedClients = apply(
    clients.map(client => ({
      ...client,
      status: deriveClientStatus(client),
      // Whatever this client absorbed travels in its name, so searching by the
      // old name still finds the records that came in under it.
      clientName: clientDisplayName(clients, client),
    }))
  ).sort((a, b) => {
    const aIsInactive = a.status !== "Active";
    const bIsInactive = b.status !== "Active";
    if (aIsInactive && !bIsInactive) return 1;
    if (!aIsInactive && bIsInactive) return -1;
    return 0;
  });

  // Column definitions
  const columns = [
    {
      key: "clientNo",
      header: "Client No.",
      width: "10%",
      render: (value, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/clients/${row.id}`);
          }}
          className="font-medium text-primary underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
        >
          {value}
        </button>
      )
    },
    {
      key: "type",
      header: "Type",
      width: "12%"
    },
    {
      key: "clientName",
      header: "Client Name",
      width: "22%",
      cellClassName: "font-medium",
    },
    {
      // Number, expiry and the attached copy read as one block per record.
      key: "referenceNo",
      header: "Reference No.",
      width: "20%",
      render: (value, row) => (
        <div className="space-y-1">
          <p>{value}</p>
          <ExpiryDate date={row.referenceExpiryDate} />
          <DocumentLink url={row.attachments?.referenceCopy} />
        </div>
      ),
    },
    {
      key: "poaNo",
      header: "POA No.",
      width: "20%",
      render: (value, row) => (
        <div className="space-y-1">
          <p>{value}</p>
          <ExpiryDate date={row.poaExpiryDate} />
          <DocumentLink url={row.attachments?.poaCopy} />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "10%",
      render: (value) => <StatusDot status={value} isGood={value === "Active"} />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-primary">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Clients
            </h1>
            <p className="text-xs sm:text-sm text-primary/75">
              Manage client information
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/clients/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <ActiveFilters
        filters={active}
        onClear={clear}
        resultCount={processedClients.length}
      />

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={processedClients}
            searchPlaceholder="Ask anything..."
            enableColumnSearch={false}
            onAdd={() => navigate('/clients/create')}
            addLabel="Add Client"
            currentPage={currentPage}
            totalPages={Math.ceil(processedClients.length / pageSize)}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );
}
