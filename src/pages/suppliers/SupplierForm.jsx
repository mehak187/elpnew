import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Truck, ArrowLeft, Save } from "lucide-react";
import { useSuppliers } from "@/lib/suppliers/context";
import SupplierFields from "./SupplierFields";
import {
  canSaveSupplier,
  emptySupplier,
  toSupplierRecord,
} from "./supplierData";

export default function SupplierForm() {
  const navigate = useNavigate();
  const { addSupplier } = useSuppliers();

  const [draft, setDraft] = useState(emptySupplier);
  const [error, setError] = useState("");

  const set = (name, value) => setDraft((prev) => ({ ...prev, [name]: value }));

  const canSave = canSaveSupplier(draft);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) {
      setError("A supplier needs at least a name and a category.");
      return;
    }
    addSupplier(toSupplierRecord(draft));
    navigate("/suppliers");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary text-primary hover:bg-accent"
            onClick={() => navigate("/suppliers")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="rounded-xl bg-primary p-2 sm:p-3">
            <Truck className="h-5 w-5 text-primary-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary sm:text-2xl">
              Add Supplier
            </h1>
            <p className="text-xs text-primary/75 sm:text-sm">
              Create a new supplier record
            </p>
          </div>
        </div>
        <Button type="submit" form="supplier-form" disabled={!canSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
              <SupplierFields draft={draft} set={set} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
