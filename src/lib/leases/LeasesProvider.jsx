import { useMemo, useState } from "react";
import { LeasesContext } from "./context";
import { initialLeases } from "@/pages/leases/leaseData";

/** What a lease holds before its contract has been entered. */
const EMPTY_CONTRACT = {
  contractStatus: "",
  contractNo: "",
  contractFile: "",
  building: "",
  unit: "",
  address: "",
  start: "",
  end: "",
  rent: 0,
  vatApplied: true,
  method: "",
  paymentFile: "",
  bankAccountId: "",
  installments: "",
  paymentDay: "",
  cheques: {},
  nonRenewalDate: "",
  nonRenewalFile: "",
  payments: {},
  cancelled: [],
  installmentNotes: {},
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
       * A new lease, newest first so it is at the top of the table it was
       * added from. Its contract - number included, which is the one on the
       * signed paper - is entered later, on the lease's own page.
       */
      addLease: (record) =>
        setLeases((prev) => [
          {
            ...EMPTY_CONTRACT,
            ...record,
            id: prev.reduce((max, lease) => Math.max(max, lease.id), 0) + 1,
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
