import { useEffect, useMemo, useState } from "react";
import { FirmContext } from "./context";
import {
  initialFirmInfo,
  initialBranches,
  initialDocuments,
  initialBankAccounts,
  initialPayments,
  initialExpenses,
  initialTransfers,
  nextBranchNumber,
  nextDocumentId,
  nextTransferNo,
  dayOffset,
} from "@/pages/firm/firmData";

const nextId = (rows) => rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;

export default function FirmProvider({ children }) {
  const [firmInfo, setFirmInfo] = useState(initialFirmInfo);
  const [branches, setBranches] = useState(initialBranches);
  const [documents, setDocuments] = useState(initialDocuments);
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts);
  const [payments, setPayments] = useState(initialPayments);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [transfers, setTransfers] = useState(initialTransfers);

  // The firm name is stored once and displayed everywhere it appears, the
  // browser tab included.
  useEffect(() => {
    document.title = firmInfo.nameEn || "Law Firm";
  }, [firmInfo.nameEn]);

  const value = useMemo(
    () => ({
      firmInfo,
      branches,
      documents,
      bankAccounts,
      payments,
      expenses,
      transfers,

      updateFirmInfo: (changes) =>
        setFirmInfo((prev) => ({ ...prev, ...changes })),

      // The branch number is assigned by the system, never typed by the user,
      // and is stored on the record for the case-numbering logic to read.
      addBranch: (branch) =>
        setBranches((prev) => [
          ...prev,
          { ...branch, id: nextId(prev), branchNumber: nextBranchNumber(prev) },
        ]),

      // The number is the one thing a branch cannot change: case files are
      // filed under it, so it stays with the branch for good.
      updateBranch: (id, changes) =>
        setBranches((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, ...changes, branchNumber: b.branchNumber } : b
          )
        ),

      // A document is quoted by its reference, so it is given one here rather
      // than by whichever screen happens to be adding it.
      addDocument: (document) =>
        setDocuments((prev) => [
          ...prev,
          { ...document, id: nextId(prev), docId: nextDocumentId(prev) },
        ]),

      updateDocument: (id, changes) =>
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...changes } : d))
        ),

      removeDocument: (id) =>
        setDocuments((prev) => prev.filter((d) => d.id !== id)),

      addBankAccount: (account) =>
        setBankAccounts((prev) => [
          ...prev,
          { ...account, id: nextId(prev), openedAt: dayOffset(0), active: true },
        ]),

      updateBankAccount: (id, changes) =>
        setBankAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...changes } : a))
        ),

      setAccountActive: (id, active) =>
        setBankAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, active } : a))
        ),

      addExpense: (expense) =>
        setExpenses((prev) => [...prev, { ...expense, id: nextId(prev) }]),

      addPayment: (payment) =>
        setPayments((prev) => [...prev, { ...payment, id: nextId(prev) }]),

      addTransfer: (transfer) =>
        setTransfers((prev) => [
          ...prev,
          { ...transfer, id: nextId(prev), transferNo: nextTransferNo(prev) },
        ]),
    }),
    [firmInfo, branches, documents, bankAccounts, payments, expenses, transfers]
  );

  return <FirmContext.Provider value={value}>{children}</FirmContext.Provider>;
}
