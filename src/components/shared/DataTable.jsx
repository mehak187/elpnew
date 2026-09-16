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
import AiSearch from "./AiSearch";
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
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toCsv, downloadCsv } from "@/lib/csv";
import { smartSearch } from "@/lib/search/smartSearch";

/**
 * Which way a column is sorted.
 *
 * An unsorted column still shows a faint pair of arrows, so a sortable
 * heading looks sortable before anybody clicks it.
 */
function SortMark({ direction }) {
  if (!direction) {
    return <ChevronsUpDown className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40" />;
  }
  const Icon = direction === "asc" ? ChevronUp : ChevronDown;
  return <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />;
}

/**
 * A column's heading, on one line.
 *
 * What the column holds, and beside it in lighter type what makes it up.
 * Stacked over two lines the second line reads as another header row, which is
 * what the heading of a single column must not look like.
 */
function ColumnHeading({ header, subHeader }) {
  if (!subHeader) return header;
  // Details are read as an aside, so they are bracketed - unless they say so
  // themselves already.
  const detail =
    typeof subHeader === "string" && !subHeader.startsWith("(")
      ? "(" + subHeader + ")"
      : subHeader;

  return (
    <>
      {header} <span className="font-normal text-muted-foreground">{detail}</span>
    </>
  );
}

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
  itemLabel,
  exportFileName = "export.csv",
  onAdd,
  addLabel = "Add",
  filters,
  onRowClick,
  enableColumnSearch = true,
  enableSorting = false,
  // Says whether a row's record has ended - cancelled, inactive, expired.
  // Those are kept, but they belong under the live ones.
  endedRow,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  // Column key and direction, or null while the table is in its natural order.
  const [sort, setSort] = useState(null);

  // Off, then ascending, then descending, then back to the order the data came
  // in - so a sort can always be taken back off.
  const toggleSort = (columnKey) =>
    setSort((prev) => {
      if (prev?.key !== columnKey) return { key: columnKey, direction: "asc" };
      return prev.direction === "asc"
        ? { key: columnKey, direction: "desc" }
        : null;
    });

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

  // Contextual search over every value on the row. Skipped when the parent
  // handles searching itself via onSearch.
  const searchedData = onSearch ? data : smartSearch(data, searchValue);

  // Filter data based on column filters
  const filteredData = enableColumnSearch ? searchedData.filter(row => {
    return Object.entries(columnFilters).every(([columnKey, filterValue]) => {
      if (!filterValue) return true;
      const cellValue = row[columnKey];
      if (cellValue === null || cellValue === undefined) return false;
      return String(cellValue).toLowerCase().includes(filterValue.toLowerCase());
    });
  }) : searchedData;

  /**
   * What a column sorts on.
   *
   * A rendered cell can hold anything, so the column says what its value is:
   * its own sortValue where it needs one, the export value where that already
   * flattens the row, and the raw field otherwise.
   */
  const sortValueOf = (column, row) => {
    if (column.sortValue) return column.sortValue(row);
    if (column.exportValue) return column.exportValue(row);
    return row[column.key];
  };

  const sortedData = (() => {
    if (!sort) return filteredData;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return filteredData;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...filteredData].sort((a, b) => {
      const left = sortValueOf(column, a);
      const right = sortValueOf(column, b);
      if (left === right) return 0;
      // Blanks sort last whichever way the column is pointing.
      if (left === null || left === undefined) return 1;
      if (right === null || right === undefined) return -1;
      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * direction;
      }
      return (
        String(left).localeCompare(String(right), undefined, { numeric: true }) *
        direction
      );
    });
  })();

  /**
   * The rows that have ended, under the rows that have not.
   *
   * Whatever order the table is in otherwise is kept inside each of the two
   * groups, so sorting a column still sorts - it simply sorts the live records
   * and the finished ones separately.
   */
  const orderedData = endedRow
    ? [
        ...sortedData.filter((row) => !endedRow(row)),
        ...sortedData.filter((row) => endedRow(row)),
      ]
    : sortedData;

  // Calculate total pages based on filtered data
  const calculatedTotalPages = Math.ceil(orderedData.length / pageSize) || 1;

  // Paginate filtered data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = orderedData.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Filters and Search Row */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">

        {/* Global Search, first on the row wherever it appears */}
        <AiSearch
          value={searchValue}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
        />

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
        {/* overflow-hidden: the header's tint and the cell rules stop at the
            card's rounded corner instead of squaring it off. */}
        <Card className="overflow-hidden">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            <ScrollArea className="w-full">
              {/* The frame every table in the system is drawn in: ruled cells,
                  a tinted single-line header, figures to the right. It lives
                  here so the pages that use this table cannot drift apart.
                  The outer edge is the card's own rounded border - a second,
                  square one inside it shows through at the corners. */}
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-secondary/60 hover:bg-secondary/60">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={cn(
                          // Top, not middle: where one heading wraps, the
                          // short ones beside it still start on its first line.
                          "border-r p-3 text-left align-top font-semibold text-primary last:border-r-0",
                          column.className
                        )}
                        style={{ width: column.width }}
                      >
                        {enableSorting && !column.disableSort ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className="inline-flex items-start gap-1 rounded text-left hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <span>
                              <ColumnHeading
                                header={column.header}
                                subHeader={column.subHeader}
                              />
                            </span>
                            <SortMark
                              direction={
                                sort?.key === column.key ? sort.direction : null
                              }
                            />
                          </button>
                        ) : (
                          <ColumnHeading
                            header={column.header}
                            subHeader={column.subHeader}
                          />
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                  {enableColumnSearch && (
                    <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                      {columns.map((column) => (
                        <TableHead
                          key={`filter-${column.key}`}
                          className="border-r p-2 last:border-r-0"
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
                          "align-top hover:bg-primary/5",
                          onRowClick && "cursor-pointer"
                        )}
                        onClick={() => onRowClick && onRowClick(row)}
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={cn(
                              "border-r p-3 text-left text-sm last:border-r-0",
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
          {itemLabel && filteredData.length > 0
            ? "Showing " +
              ((currentPage - 1) * pageSize + 1) +
              " to " +
              Math.min(currentPage * pageSize, filteredData.length) +
              " of " +
              filteredData.length +
              " " +
              itemLabel
            : "Page " + currentPage + " of " + calculatedTotalPages}
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
