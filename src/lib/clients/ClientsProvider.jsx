import { useMemo, useState } from "react";
import { ClientsContext } from "./context";
import { clientRecords } from "@/pages/clients/clientRecords";

export default function ClientsProvider({ children }) {
  const [clients, setClients] = useState(clientRecords);

  const value = useMemo(
    () => ({
      clients,

      findClient: (id) => clients.find((c) => c.id === Number(id)) || null,

      findByNo: (clientNo) =>
        clients.find((c) => c.clientNo === clientNo) || null,

      /**
       * Merge one client into another.
       *
       * The merged client is not deleted and keeps its own name: everything it
       * brought in now reads under the main client, but the trail back to where
       * those records came from has to survive, so the record stays and simply
       * points at its new home.
       */
      mergeClients: (fromNo, intoNo) =>
        setClients((prev) =>
          prev.map((client) =>
            client.clientNo === fromNo
              ? {
                  ...client,
                  mergedIntoClientNo: intoNo,
                  mergedOn: new Date().toISOString().slice(0, 10),
                }
              : client
          )
        ),
    }),
    [clients]
  );

  return (
    <ClientsContext.Provider value={value}>{children}</ClientsContext.Provider>
  );
}
