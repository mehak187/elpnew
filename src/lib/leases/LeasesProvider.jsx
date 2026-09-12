import { useMemo, useState } from "react";
import { LeasesContext } from "./context";
import { initialLeases, nextContractNo } from "@/pages/leases/leaseData";

/** What a lease holds before its contract has been entered. */
const EMPTY_CONTRACT = {
  building: "",
  unit: "",
  address: "",
  start: "",
  end: "",
  rent: 0,
  frequency: "",
  method: "",
};

/**
 * The leases, in one place.
 *
 * The table and a lease's own page read and change the same records, so a
 * correction made on the lease is what the table shows the moment you go back.
 */
export default function LeasesProvider({ children }) {
  const [leases, setLeases] = useState(initialLeases);

  const value = useMemo(
    () => ({
      leases,

      findLease: (id) => leases.find((lease) => lease.id === Number(id)) || null,

      /**
       * A new lease, given its number here so two can never share one. Newest
       * first, so it is at the top of the table it was added from.
       */
      addLease: (record) =>
        setLeases((prev) => [
          {
            ...EMPTY_CONTRACT,
            ...record,
            id: prev.reduce((max, lease) => Math.max(max, lease.id), 0) + 1,
            contractNo: nextContractNo(prev),
          },
          ...prev,
        ]),

      updateLease: (id, changes) =>
        setLeases((prev) =>
          prev.map((lease) =>
            lease.id === Number(id) ? { ...lease, ...changes } : lease
          )
        ),
    }),
    [leases]
  );

  return (
    <LeasesContext.Provider value={value}>{children}</LeasesContext.Provider>
  );
}
