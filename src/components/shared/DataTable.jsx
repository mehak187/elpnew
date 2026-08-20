import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";

export default function DataTable({
  columns,
  data,
  searchPlaceholder = "Search...",
  onSearch,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 100,
  isLoading = false,
  showExport = true,
  exportFileName = "export.csv",
  onAdd,
  addLabel = "Add",
  filters,
  onRowClick,
  enableColumnSearch = true,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [columnFilters, setColumnFilters] = useState({});

  const handleSearch = (value) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleColumnFilterChange = (columnKey, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  };

  // Global search across every searchable column. Skipped when the parent
  // handles searching itself via onSearch.
  const searchTerm = onSearch ? "" : searchValue.trim().toLowerCase();
  const searchableKeys = columns
    .filter((c) => c.key !== "actions" && !c.disableFilter)
    .map((c) => c.key);

  const searchedData = searchTerm
    ? data.filter((row) =>
        searchableKeys.some((key) => {
          const cellValue = row[key];
          if (cellValue === null || cellValue === undefined) return false;
          if (typeof cellValue === "object") return false;
          return String(cellValue).toLowerCase().includes(searchTerm);
        })
      )
    : data;

  // Filter data based on column filters
  const filteredData = enableColumnSearch ? searchedData.filter(row => {
    return Object.entries(columnFilters).every(([columnKey, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = row[columnKey];
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    });
  }) : searchedData;

  // Calculate total pages based on filtered data
  const calculatedTotalPages = Math.ceil(filteredData.length / pageSize) || 1;

  // Paginate filtered data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Filters and Search Row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">

        {/* Global Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Custom Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {filters}
        </div>

        {/* Spacer */}
        <div className="hidden sm:block flex-1" />

        {/* Page Size and Export */}
        <div className="flex items-center gap-2 justify-between sm:justify-end">
          <Select
            value={pageSize.toString()}
            onValueChange={(value) =>
              onPageSizeChange && onPageSizeChange(parseInt(value))
            }
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>

          {showExport && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              title="Export to CSV"
              onClick={() =>
                downloadCsv(toCsv(columns, filteredData), exportFileName)
              }
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span className="sr-only">Export to CSV</span>
            </Button>
          )}

          {onAdd && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={onAdd}
              title={addLabel}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">{addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Layout - Always show table on all screen sizes */}
      <div className="block">
        <Card>
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          "text-left font-semibold text-primary whitespace-nowrap",
                          column.className
                        )}
                        style={{ width: column.width }}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                  {enableColumnSearch && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      {columns.map((column) => (
                        <TableHead
                          key={`filter-${column.key}`}
                          className="p-2"
                          style={{ width: column.width }}
                        >
                          {column.filterComponent ? (
                            column.filterComponent
                          ) : column.key !== 'actions' && !column.disableFilter ? (
                            <Input
                              type="text"
                              value={columnFilters[column.key] || ""}
                              onChange={(e) => handleColumnFilterChange(column.key, e.target.value)}
                              className="h-8 text-xs"
                            />
                          ) : null}
                        </TableHead>
                      ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, rowIndex) => (
                      <TableRow
                        key={row.id || rowIndex}
                        className={cn(
                          rowIndex % 2 === 0 ? "bg-white" : "bg-muted/30",
                          onRowClick &&
                            "cursor-pointer hover:bg-primary/5 transition-colors"
                        )}
                        onClick={() => onRowClick && onRowClick(row)}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              "text-left text-sm",
                              column.cellClassName
                            )}
                          >
                            {column.render
                              ? column.render(row[column.key], row)
                              : row[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Page {currentPage} of {calculatedTotalPages}
        </p>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange && onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-9"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Page numbers - desktop only */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(5, calculatedTotalPages) }, (_, i) => {
              let pageNum;
              if (calculatedTotalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= calculatedTotalPages - 2) {
                pageNum = calculatedTotalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange && onPageChange(pageNum)}
                  className="h-9 w-9"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange && onPageChange(currentPage + 1)}
            disabled={currentPage >= calculatedTotalPages}
            className="h-9"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
