import { useState } from "react";
import { Filter } from "lucide-react";
import DataTable from "@/components/shared/DataTable";
import FilterPanel from "@/components/shared/FilterPanel";
import { filterChips, withoutChip } from "@/lib/filterChips";

/**
 * A list of requests in the system's one table: search, Filters, rows per
 * page and the Excel download on the left, the way to add one on the right,
 * and the rows under them.
 *
 * Every list of requests on an employee's file draws through here, so they
 * all search, narrow, page and export alike. The page says what the columns
 * are and, with `filterBy`, which of a row's fields it can be narrowed by -
 * each offered with the values the rows actually hold.
 */
export default function RequestTable({
  rows,
  columns,
  searchPlaceholder,
  itemLabel = "requests",
  exportFileName = "requests.csv",
  // [{ key, label }]: the fields the Filters panel offers, by row field.
  filterBy = [{ key: "status", label: "Status" }],
  onAdd,
  addLabel,
  endedRow,
}) {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Each filter offers what is there to choose: the values on the rows. The
  // Filters button is there on every list, as on every table in the system.
  const fields = filterBy.map((field) => {
    const values = [...new Set(rows.map((row) => row[field.key]).filter(Boolean))];
    return {
      key: field.key,
      label: field.label,
      icon: Filter,
      type: "radio",
      options: [
        { value: "all", label: "All" },
        ...values.map((value) => ({ value, label: String(value) })),
      ],
    };
  });

  const narrow = (next) => {
    setFilters(next);
    setPage(1);
  };

  const shown = rows.filter((row) =>
    Object.entries(filters).every(
      ([key, value]) => !value || value === "all" || String(row[key]) === String(value)
    )
  );

  return (
    <DataTable
      columns={columns}
      data={shown}
      itemLabel={itemLabel}
      searchPlaceholder={searchPlaceholder}
      exportFileName={exportFileName}
      enableColumnSearch={false}
      keepOrder
      currentPage={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
      filters={<FilterPanel fields={fields} value={filters} onChange={narrow} />}
      appliedFilters={filterChips(fields, filters)}
      onRemoveFilter={(chip) => narrow(withoutChip(filters, chip))}
      onClearFilters={() => narrow({})}
      onAdd={onAdd || undefined}
      addLabel={addLabel}
      endedRow={endedRow}
    />
  );
}
