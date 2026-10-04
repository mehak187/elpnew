import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/pages/firm/firmData";
import {
  ArrowRight,
  Check,
  CircleAlert,
  CloudUpload,
  Eye,
  File,
  FileSignature,
  FileText,
  FileUser,
  Globe,
  GraduationCap,
  IdCard,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  SquareUserRound,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import {
  INTAKE_ACCEPT,
  INTAKE_TYPES,
  PROFILE_REQUIRED,
  extractDemo,
  intakeFileProblem,
  intakeType,
} from "../documentIntake";

/** Each kind's mark and colour, on its tile and its chip in the table. */
const LOOK = {
  civilId: { icon: IdCard, tile: "bg-blue-50 text-blue-600", chip: "bg-blue-50 text-blue-700" },
  passport: { icon: Globe, tile: "bg-slate-800 text-white", chip: "bg-violet-50 text-violet-700" },
  contract: { icon: FileSignature, tile: "bg-emerald-50 text-emerald-600", chip: "bg-teal-50 text-teal-700" },
  cv: { icon: FileUser, tile: "bg-violet-50 text-violet-600", chip: "bg-violet-50 text-violet-700" },
  education: { icon: GraduationCap, tile: "bg-orange-50 text-orange-500", chip: "bg-orange-50 text-orange-600" },
  lawyerCard: { icon: SquareUserRound, tile: "bg-pink-50 text-pink-600", chip: "bg-pink-50 text-pink-700" },
  bank: { icon: Landmark, tile: "bg-cyan-50 text-cyan-600", chip: "bg-cyan-50 text-cyan-700" },
  other: { icon: File, tile: "bg-slate-100 text-slate-600", chip: "bg-slate-100 text-slate-700" },
};

// How long the demo takes to "read" a paper, so the step shows it working.
const READ_MS = 900;

/**
 * Step one of Add Employee: the papers first, and the profile filled in from
 * them.
 *
 * A paper is added under the tile for its kind. Once read, whatever it says
 * is written into the profile's empty fields - never over something already
 * there - and the table says what was found and whether anything needs a
 * person to look at it. The steps after this one are then mostly checking.
 */
export default function DocumentIntake({ documents, onDocuments, employee, onFill, onContinue, onCancel }) {
  // The kind being uploaded, while the upload panel is open.
  const [uploading, setUploading] = useState(null);
  const [problem, setProblem] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // The upload panel closes on a click anywhere outside it, or on Escape.
  // A click on another tile closes it here and opens it again for that kind.
  useEffect(() => {
    if (!uploading) return;
    const close = () => {
      setUploading(null);
      setProblem("");
      setDragging(false);
    };
    const onPointer = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [uploading]);
  // Counted on from the papers already on the list, so each keeps its own id.
  const nextId = useRef(documents.reduce((max, d) => Math.max(max, d.id), 0));

  /**
   * Reads a paper against the profile as it stands in `base`: what it says
   * goes into the fields still empty there, and `base` is brought up to date,
   * so the next paper read with it does not count the same field again.
   */
  const read = (doc, base, fills) => {
    const result = extractDemo(doc.typeKey);
    const filled = Object.keys(result.values).filter((key) => !base[key]);
    filled.forEach((key) => {
      base[key] = result.values[key];
      fills[key] = result.values[key];
    });
    return {
      number: result.number,
      expiry: result.expiry,
      review: result.review,
      filled: filled.length,
      status: result.review ? "review" : "processed",
    };
  };

  const add = (file) => {
    const wrong = intakeFileProblem(file);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    nextId.current += 1;
    const doc = {
      id: nextId.current,
      typeKey: uploading,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      status: "processing",
      filled: 0,
      review: 0,
    };
    onDocuments((prev) => [...prev, doc]);
    closePanel();
    setTimeout(() => {
      const fills = {};
      const result = read(doc, { ...employee }, fills);
      onFill(fills);
      onDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...result } : d)));
    }, READ_MS);
  };

  /** Reads every paper again, filling whatever has since been emptied. */
  const reprocess = () => {
    const papers = documents;
    onDocuments((prev) => prev.map((d) => ({ ...d, status: "processing" })));
    setTimeout(() => {
      const base = { ...employee };
      const fills = {};
      const results = Object.fromEntries(papers.map((d) => [d.id, read(d, base, fills)]));
      onFill(fills);
      // What a paper filled before still counts; anything newly filled adds.
      onDocuments((prev) =>
        prev.map((d) =>
          results[d.id]
            ? { ...d, ...results[d.id], filled: (d.filled || 0) + results[d.id].filled }
            : d
        )
      );
    }, READ_MS);
  };

  const remove = (id) => onDocuments((prev) => prev.filter((d) => d.id !== id));

  const openPanel = (typeKey) => {
    setUploading(typeKey);
    setProblem("");
  };
  const closePanel = () => {
    setUploading(null);
    setProblem("");
    setDragging(false);
  };

  // The summary under the table.
  const done = documents.filter((d) => d.status === "processed").length;
  const filledCount = documents.reduce((sum, d) => sum + (d.filled || 0), 0);
  const reviewCount = documents.reduce(
    (sum, d) => sum + (d.status === "review" ? d.review || 0 : 0),
    0
  );
  const missingCount = PROFILE_REQUIRED.filter((key) => !employee[key]).length;
  const busy = documents.some((d) => d.status === "processing");

  return (
    <Card>
      <CardContent className="relative p-4 sm:p-6">
        {/* The step's head, as every step of Add Employee has it. */}
        <div className="mb-6 flex items-center gap-3 border-b pb-4">
          <span aria-hidden="true" className="w-1 self-stretch rounded-full bg-primary" />
          <FileText strokeWidth={1.5} aria-hidden="true" className="size-8 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-primary">Document Intake</h2>
            <p className="text-sm text-primary/75">
              Upload employee documents. SADEED will classify them, extract the
              information and automatically fill the employee profile.
            </p>
          </div>
        </div>

        {/* One tile per kind of paper; the + under it adds one. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {INTAKE_TYPES.map((type) => {
            const look = LOOK[type.key];
            const Icon = look.icon;
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => openPanel(type.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border bg-blue-50/30 px-2 py-3 text-center transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  uploading === type.key && "border-blue-600 bg-blue-50"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("flex size-12 items-center justify-center rounded-lg", look.tile)}
                >
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <span className="flex min-h-10 items-center text-sm font-medium leading-tight text-primary">
                  {type.label}
                </span>
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-white text-primary shadow-sm"
                >
                  <Plus className="size-4" />
                </span>
                <span className="sr-only">Upload {type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Where the paper is dropped or chosen, over the tiles' right side. */}
        {uploading && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label={"Upload " + intakeType(uploading)?.label}
            className="absolute end-4 top-4 z-20 w-[calc(100%-2rem)] space-y-4 rounded-xl border bg-card p-5 shadow-xl sm:end-6 sm:top-6 sm:w-md"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-primary">
                Upload Document
                <span className="ms-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {intakeType(uploading)?.label}
                </span>
              </h3>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-md p-1 text-primary hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) add(file);
              }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragging ? "border-blue-600 bg-blue-50" : "border-blue-200 bg-blue-50/30"
              )}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <CloudUpload className="size-7" aria-hidden="true" />
              </span>
              <p className="font-semibold text-primary">Drag &amp; drop your file here</p>
              <p className="text-sm text-primary/75">or click to browse</p>
              <Button
                type="button"
                variant="outline"
                className="mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload className="me-2 h-4 w-4" aria-hidden="true" />
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, JPG, JPEG, PNG (Max 10 MB each)
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={INTAKE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) add(file);
                }}
              />
            </div>
            {problem && (
              <p role="alert" className="text-sm text-destructive">
                {problem}
              </p>
            )}
            <div className="flex justify-end border-t pt-4">
              <Button type="button" variant="outline" onClick={closePanel}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* What has been uploaded, and what was read from each. */}
        <section className="mt-6 overflow-hidden rounded-xl border">
          <h3 className="px-4 py-3 font-bold text-primary">
            Uploaded Documents ({documents.length})
          </h3>
          {documents.length === 0 ? (
            <p className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
              No documents uploaded yet. Choose a document type above to start.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-sm">
                <thead className="bg-table-head text-start text-xs font-semibold text-primary">
                  <tr>
                    <th className="px-4 py-2 text-start">Document Name</th>
                    <th className="px-4 py-2 text-start">Document Type</th>
                    <th className="px-4 py-2 text-start">Document Number</th>
                    <th className="px-4 py-2 text-start">Expiry Date</th>
                    <th className="px-4 py-2 text-start">Status</th>
                    <th className="px-4 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const type = intakeType(doc.typeKey);
                    return (
                      <tr key={doc.id} className="border-t">
                        <td className="px-4 py-2.5 text-primary">{doc.fileName}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("rounded-md px-2 py-1 text-xs font-medium", LOOK[doc.typeKey].chip)}>
                            {type?.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-primary">{doc.number || "-"}</td>
                        <td className="px-4 py-2.5 text-primary">
                          {doc.expiry ? formatDate(doc.expiry) : "-"}
                        </td>
                        <td className="px-4 py-2.5">
                          {doc.status === "processing" ? (
                            <span className="flex items-center gap-2 font-medium text-blue-700">
                              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                              Processing
                            </span>
                          ) : doc.status === "review" ? (
                            <span className="flex items-center gap-2 font-medium text-amber-600">
                              <TriangleAlert className="size-5 fill-amber-500 text-white" aria-hidden="true" />
                              Review Required
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 font-medium text-green-700">
                              <span className="flex size-5 items-center justify-center rounded-full bg-green-600 text-white">
                                <Check className="size-3.5" aria-hidden="true" />
                              </span>
                              Processed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              title={"View " + doc.fileName}
                              onClick={() => window.open(doc.fileUrl, "_blank", "noopener,noreferrer")}
                              className="rounded-md p-1.5 text-primary hover:bg-menu-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Eye className="size-4" aria-hidden="true" />
                              <span className="sr-only">View {doc.fileName}</span>
                            </button>
                            <button
                              type="button"
                              title={"Remove " + doc.fileName}
                              onClick={() => remove(doc.id)}
                              className="rounded-md p-1.5 text-primary hover:bg-red-50 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              <span className="sr-only">Remove {doc.fileName}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* What the papers have done for the profile so far. */}
        {documents.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-green-100 bg-green-50/40 px-4 py-3">
            <p className="flex items-center gap-2 font-semibold text-green-700">
              <span className="flex size-7 items-center justify-center rounded-full bg-green-600 text-white">
                <Check className="size-4" aria-hidden="true" />
              </span>
              {done} of {documents.length} documents processed successfully
            </p>
            {[
              { icon: FileText, tone: "text-blue-600", value: filledCount, label: "Fields filled automatically" },
              { icon: TriangleAlert, tone: "text-amber-500", value: reviewCount, label: "Fields need review" },
              { icon: CircleAlert, tone: "text-red-600", value: missingCount, label: "Fields still missing" },
            ].map((fact) => {
              const Icon = fact.icon;
              return (
                <div key={fact.label} className="flex items-center gap-2 border-s ps-6">
                  <Icon className={cn("size-6", fact.tone)} aria-hidden="true" />
                  <div>
                    <p className="text-lg font-bold leading-none text-primary">{fact.value}</p>
                    <p className="text-xs text-primary/75">{fact.label}</p>
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" className="ms-auto" onClick={reprocess} disabled={busy}>
              <RefreshCw className={cn("me-2 h-4 w-4", busy && "animate-spin")} aria-hidden="true" />
              Reprocess Documents
            </Button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <Button type="button" variant="outline" className="min-w-28" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-blue-700 text-white hover:bg-blue-800"
            disabled={busy}
            onClick={onContinue}
          >
            Continue to Personal Information
            <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
