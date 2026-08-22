import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import ActiveFilters from "@/components/shared/ActiveFilters";
import { useListFilter } from "@/lib/useListFilter";
import { deriveClientStatus } from "@/lib/clientStatus";

// Demo expiry dates are generated around today so the expired and still-valid
// states are both visible whenever the app is run.
const DAY = 24 * 60 * 60 * 1000;
const dayOffset = (days) =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

const clients = [
  // 15 Active Clients
  {
    id: 1,
    clientNo: "1",
    type: "Bank",
    clientName: "ABC Holdings LLC",
    referenceNo: "REF-2024-001",
    referenceExpiryDate: dayOffset(-140),
    poaNo: "6565777",
    poaExpiryDate: dayOffset(90),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 3,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 2,
    clientNo: "2",
    type: "Individual",
    clientName: "Fatima Rashid",
    referenceNo: "REF-2024-002",
    referenceExpiryDate: dayOffset(60),
    poaNo: "6565914",
    poaExpiryDate: dayOffset(-25),
    attachments: { poaCopy: false, referenceCopy: false },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 3,
    clientNo: "3",
    type: "Finance Company",
    clientName: "Al Madina Trading",
    referenceNo: "REF-2024-003",
    referenceExpiryDate: dayOffset(-35),
    poaNo: "6566051",
    poaExpiryDate: dayOffset(240),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 2,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 4,
    clientNo: "4",
    type: "Insurance Company",
    clientName: "Gulf Construction Co",
    referenceNo: "REF-2024-004",
    referenceExpiryDate: dayOffset(210),
    poaNo: "6566188",
    poaExpiryDate: dayOffset(-110),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 5,
    clientNo: "5",
    type: "Individual",
    clientName: "Ahmed Al Lawati",
    referenceNo: "REF-2024-005",
    referenceExpiryDate: dayOffset(95),
    poaNo: "6566325",
    poaExpiryDate: dayOffset(45),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 4,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 6,
    clientNo: "6",
    type: "Telecom Company",
    clientName: "Muscat Finance LLC",
    referenceNo: "REF-2024-006",
    referenceExpiryDate: dayOffset(-8),
    poaNo: "6566462",
    poaExpiryDate: dayOffset(180),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 2,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 7,
    clientNo: "7",
    type: "Individual",
    clientName: "Salim Al Rawahi",
    referenceNo: "REF-2024-007",
    referenceExpiryDate: dayOffset(320),
    poaNo: "6566599",
    poaExpiryDate: dayOffset(-55),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 8,
    clientNo: "8",
    type: "Real Estate Company",
    clientName: "Salalah Port Services",
    referenceNo: "REF-2024-008",
    referenceExpiryDate: dayOffset(155),
    poaNo: "6566736",
    poaExpiryDate: dayOffset(300),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 3,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 9,
    clientNo: "9",
    type: "Individual",
    clientName: "Layla Al Balushi",
    referenceNo: "REF-2024-009",
    referenceExpiryDate: dayOffset(-70),
    poaNo: "6566873",
    poaExpiryDate: dayOffset(70),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 10,
    clientNo: "10",
    type: "Automotive Company",
    clientName: "Nizwa Cement Factory",
    referenceNo: "REF-2024-010",
    referenceExpiryDate: dayOffset(410),
    poaNo: "6567010",
    poaExpiryDate: dayOffset(-15),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 2,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 11,
    clientNo: "11",
    type: "Individual",
    clientName: "Hassan Al Jabri",
    referenceNo: "REF-2024-011",
    referenceExpiryDate: dayOffset(25),
    poaNo: "6567147",
    poaExpiryDate: dayOffset(365),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 5,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 12,
    clientNo: "12",
    type: "Commercial Company",
    clientName: "Sohar Aluminum",
    referenceNo: "REF-2024-012",
    referenceExpiryDate: dayOffset(-190),
    poaNo: "6567284",
    poaExpiryDate: dayOffset(110),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 13,
    clientNo: "13",
    type: "Individual",
    clientName: "Nadia Al Harthi",
    referenceNo: "REF-2024-013",
    referenceExpiryDate: dayOffset(130),
    poaNo: "6567421",
    poaExpiryDate: dayOffset(-95),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 2,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 14,
    clientNo: "14",
    type: "Other Entities",
    clientName: "Oman Telecommunications",
    referenceNo: "REF-2024-014",
    referenceExpiryDate: dayOffset(-140),
    poaNo: "6567558",
    poaExpiryDate: dayOffset(90),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 1,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  {
    id: 15,
    clientNo: "15",
    type: "Individual",
    clientName: "Yousuf Al Kindi",
    referenceNo: "REF-2024-015",
    referenceExpiryDate: dayOffset(60),
    poaNo: "6567695",
    poaExpiryDate: dayOffset(-25),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 3,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: null
  },
  // 10 Closed Clients
  {
    id: 16,
    clientNo: "16",
    type: "Individual",
    clientName: "Ali Mohammed",
    referenceNo: "REF-2024-016",
    referenceExpiryDate: dayOffset(-35),
    poaNo: "6567832",
    poaExpiryDate: dayOffset(240),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-11-15"
  },
  {
    id: 17,
    clientNo: "17",
    type: "Bank",
    clientName: "XYZ Investments",
    referenceNo: "REF-2024-017",
    referenceExpiryDate: dayOffset(210),
    poaNo: "6567969",
    poaExpiryDate: dayOffset(-110),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: "1",
    statusOverride: null,
    closeDate: "2024-10-22"
  },
  {
    id: 18,
    clientNo: "18",
    type: "Finance Company",
    clientName: "Global Trade Co",
    referenceNo: "REF-2024-018",
    referenceExpiryDate: dayOffset(95),
    poaNo: "6568106",
    poaExpiryDate: dayOffset(45),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-12-01"
  },
  {
    id: 19,
    clientNo: "19",
    type: "Insurance Company",
    clientName: "Oman Steel Industries",
    referenceNo: "REF-2024-019",
    referenceExpiryDate: dayOffset(-8),
    poaNo: "6568243",
    poaExpiryDate: dayOffset(180),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-09-30"
  },
  {
    id: 20,
    clientNo: "20",
    type: "Individual",
    clientName: "Khalid Al Busaidi",
    referenceNo: "REF-2024-020",
    referenceExpiryDate: dayOffset(320),
    poaNo: "6568380",
    poaExpiryDate: dayOffset(-55),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 0,
    mergedIntoClientNo: "3",
    statusOverride: null,
    closeDate: "2024-08-15"
  },
  {
    id: 21,
    clientNo: "21",
    type: "Individual",
    clientName: "Maryam Al Hinai",
    referenceNo: "REF-2024-021",
    referenceExpiryDate: dayOffset(155),
    poaNo: "6568517",
    poaExpiryDate: dayOffset(300),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-07-20"
  },
  {
    id: 22,
    clientNo: "22",
    type: "Telecom Company",
    clientName: "Bank Muscat SAOG",
    referenceNo: "REF-2024-022",
    referenceExpiryDate: dayOffset(-70),
    poaNo: "6568654",
    poaExpiryDate: dayOffset(70),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-06-10"
  },
  {
    id: 23,
    clientNo: "23",
    type: "Individual",
    clientName: "Amira Al Siyabi",
    referenceNo: "REF-2024-023",
    referenceExpiryDate: dayOffset(410),
    poaNo: "6568791",
    poaExpiryDate: dayOffset(-15),
    attachments: { poaCopy: false, referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-05-18"
  },
  {
    id: 24,
    clientNo: "24",
    type: "Real Estate Company",
    clientName: "PDO Petroleum",
    referenceNo: "REF-2024-024",
    referenceExpiryDate: dayOffset(25),
    poaNo: "6568928",
    poaExpiryDate: dayOffset(365),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: "/documents/sample-reference.pdf" },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-04-25"
  },
  {
    id: 25,
    clientNo: "25",
    type: "Individual",
    clientName: "Rashid Al Wahaibi",
    referenceNo: "REF-2024-025",
    referenceExpiryDate: dayOffset(-190),
    poaNo: "6569065",
    poaExpiryDate: dayOffset(110),
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-03-12"
  },
];

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

/** Plain text with a small coloured dot, rather than a filled badge. */
const STATUS_DOT = {
  Active: "bg-green-500",
  Inactive: "bg-muted-foreground",
  Merged: "bg-blue-500",
};

function StatusText({ status }) {
  return (
    <span className="flex items-center gap-1.5 text-sm">
      {status}
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          STATUS_DOT[status] || "bg-muted-foreground"
        )}
      />
    </span>
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

  // Inactive and merged clients sit at the end of the list.
  const processedClients = apply(
    clients.map(client => ({ ...client, status: deriveClientStatus(client) }))
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
      render: (value) => <StatusText status={value} />,
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-3 rounded-xl bg-secondary">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              Clients
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
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
