import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataTable from "@/components/shared/DataTable";
import { Users, Plus, FileText, ScrollText, Edit, Trash2 } from "lucide-react";
import { CLIENT_TYPES } from "@/lib/constants";
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_VARIANT,
  deriveClientStatus,
} from "@/lib/clientStatus";

const clients = [
  // 15 Active Clients
  {
    id: 1,
    clientNo: "1",
    type: "Bank",
    clientName: "ABC Holdings LLC",
    referenceNo: "REF-2024-001",
    referenceExpiryDate: "2025-06-15",
    poaExpiryDate: "2025-12-31",
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
    referenceExpiryDate: "2025-11-05",
    poaExpiryDate: "2026-03-12",
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
    referenceExpiryDate: "2025-07-22",
    poaExpiryDate: "2026-02-10",
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
    referenceExpiryDate: "2025-09-12",
    poaExpiryDate: "2026-04-05",
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
    referenceExpiryDate: "2025-03-08",
    poaExpiryDate: "2025-09-22",
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
    referenceExpiryDate: "2025-06-25",
    poaExpiryDate: "2025-12-15",
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
    referenceExpiryDate: "2025-04-02",
    poaExpiryDate: "2025-10-08",
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
    referenceExpiryDate: "2025-08-28",
    poaExpiryDate: "2026-03-20",
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
    referenceExpiryDate: "2025-01-15",
    poaExpiryDate: "2025-07-10",
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
    referenceExpiryDate: "2025-10-05",
    poaExpiryDate: "2026-05-15",
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
    referenceExpiryDate: "2025-05-18",
    poaExpiryDate: "2025-11-30",
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
    referenceExpiryDate: "2025-07-08",
    poaExpiryDate: "2026-01-25",
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
    referenceExpiryDate: "2025-02-12",
    poaExpiryDate: "2025-08-28",
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
    referenceExpiryDate: "2025-09-20",
    poaExpiryDate: "2026-04-12",
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
    referenceExpiryDate: "2025-04-28",
    poaExpiryDate: "2025-10-15",
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
    referenceExpiryDate: "2025-03-20",
    poaExpiryDate: "2025-09-15",
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
    referenceExpiryDate: "2025-08-10",
    poaExpiryDate: "2026-01-20",
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
    referenceExpiryDate: "2025-01-25",
    poaExpiryDate: "2025-07-30",
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
    referenceExpiryDate: "2025-04-18",
    poaExpiryDate: "2025-10-25",
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
    referenceExpiryDate: "2025-02-28",
    poaExpiryDate: "2025-08-14",
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
    referenceExpiryDate: "2025-05-30",
    poaExpiryDate: "2025-11-18",
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
    referenceExpiryDate: "2025-06-10",
    poaExpiryDate: "2025-12-28",
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
    referenceExpiryDate: "2025-03-25",
    poaExpiryDate: "2025-09-08",
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
    referenceExpiryDate: "2025-08-15",
    poaExpiryDate: "2026-02-22",
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
    referenceExpiryDate: "2025-01-30",
    poaExpiryDate: "2025-07-18",
    attachments: { poaCopy: "/documents/sample-poa.pdf", referenceCopy: false },
    activeCases: 0,
    mergedIntoClientNo: null,
    statusOverride: null,
    closeDate: "2024-03-12"
  },
];

export default function ClientsList() {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");

  // Filter and sort clients
  const processedClients = clients
    .map(client => ({ ...client, status: deriveClientStatus(client) }))
    .filter(client => {
      if (typeFilter !== "all" && client.type !== typeFilter) return false;
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      // First priority: Move inactive and merged clients to the end
      const aIsInactive = a.status !== "Active";
      const bIsInactive = b.status !== "Active";

      if (aIsInactive && !bIsInactive) return 1; // a goes to end
      if (!aIsInactive && bIsInactive) return -1; // b goes to end

      // Second priority: Sort by date only if a sort option is selected
      if (sortBy !== "none" && !aIsInactive && !bIsInactive) {
        if (sortBy === "poaExpiryDate") {
          return new Date(a.poaExpiryDate) - new Date(b.poaExpiryDate);
        } else if (sortBy === "referenceExpiryDate") {
          return new Date(a.referenceExpiryDate) - new Date(b.referenceExpiryDate);
        }
      }

      return 0;
    });

  // Attached copies open in a new tab
  const openDocument = (e, url) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Column definitions with custom filter components
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
      width: "12%",
      filterComponent: (
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CLIENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
    {
      key: "clientName",
      header: "Client Name",
      width: "20%",
      cellClassName: "font-medium",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.attachments?.poaCopy && (
            <button
              type="button"
              onClick={(e) => openDocument(e, row.attachments.poaCopy)}
              title="Open copy of the power of attorney"
              className="shrink-0 rounded p-0.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <ScrollText className="h-4 w-4" />
              <span className="sr-only">Open power of attorney for {value}</span>
            </button>
          )}
        </div>
      )
    },
    {
      key: "referenceNo",
      header: "Reference No.",
      width: "15%",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.attachments?.referenceCopy && (
            <button
              type="button"
              onClick={(e) => openDocument(e, row.attachments.referenceCopy)}
              title="Open copy of the reference number"
              className="shrink-0 rounded p-0.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Open reference document {value}</span>
            </button>
          )}
        </div>
      )
    },
    {
      key: "referenceExpiryDate",
      header: "Reference Expiry Date",
      width: "14%"
    },
    {
      key: "poaExpiryDate",
      header: "POA Expiry Date",
      width: "14%",
      filterComponent: (
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Sort</SelectItem>
            <SelectItem value="poaExpiryDate">POA Earliest First</SelectItem>
            <SelectItem value="referenceExpiryDate">Ref Date Earliest</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      key: "status",
      header: "Status",
      width: "8%",
      render: (value) => (
        <Badge variant={CLIENT_STATUS_VARIANT[value]}>{value}</Badge>
      ),
      filterComponent: (
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {CLIENT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "8%",
      disableFilter: true,
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/clients/${row.id}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              console.log("Delete client:", row.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
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

      <Card>
        <CardContent className="p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={processedClients}
            searchPlaceholder="Search clients..."
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
