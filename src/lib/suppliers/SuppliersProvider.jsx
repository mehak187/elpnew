import { useMemo, useState } from "react";
import { SuppliersContext } from "./context";
import { initialSuppliers } from "@/pages/suppliers/supplierData";

export default function SuppliersProvider({ children }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);

  const value = useMemo(
    () => ({
      suppliers,
      addSupplier: (supplier) =>
        setSuppliers((prev) => {
          const id = prev.reduce((max, s) => Math.max(max, s.id), 0) + 1;
          return [
            ...prev,
            { ...supplier, id, supplierId: "SUP-" + String(id).padStart(3, "0") },
          ];
        }),
      updateSupplier: (id, changes) =>
        setSuppliers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...changes } : s))
        ),
      removeSupplier: (id) =>
        setSuppliers((prev) => prev.filter((s) => s.id !== id)),
    }),
    [suppliers]
  );

  return (
    <SuppliersContext.Provider value={value}>
      {children}
    </SuppliersContext.Provider>
  );
}
