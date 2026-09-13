import { useMemo, useState } from "react";
import { AssetsContext } from "./context";
import { initialAssets, nextAssetNo } from "@/pages/assets/assetData";

/** The fixed asset register, in one place. */
export default function AssetsProvider({ children }) {
  const [assets, setAssets] = useState(initialAssets);

  // Editing the seed data while the app is open hot-reloads this provider
  // with its old state kept. Start again from the new seed whenever it changes.
  const [seed, setSeed] = useState(initialAssets);
  if (seed !== initialAssets) {
    setSeed(initialAssets);
    setAssets(initialAssets);
  }

  const value = useMemo(
    () => ({
      assets,

      /** A new asset, at the end of the register with the next number. */
      addAsset: (record) =>
        setAssets((prev) => [
          ...prev,
          {
            ...record,
            id: prev.reduce((max, asset) => Math.max(max, asset.id), 0) + 1,
            assetNo: nextAssetNo(prev),
          },
        ]),
    }),
    [assets]
  );

  return (
    <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>
  );
}
