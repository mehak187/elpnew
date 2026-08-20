import { useNavigate } from "react-router-dom";
import { Layers } from "lucide-react";
import { SectionCard } from "@/components/shared/panels";
import { casesByStage } from "../dashboardData";

export function CasesByStage() {
  const navigate = useNavigate();
  const total = casesByStage.reduce((sum, s) => sum + s.count, 0);
  const peak = Math.max(...casesByStage.map((s) => s.count));

  return (
    <SectionCard
      title="Cases by Stage"
      icon={Layers}
      action={<span className="text-xs text-muted-foreground">{total} cases</span>}
    >
      <div className="space-y-2">
        {casesByStage.map((stage) => (
          <button
            key={stage.stage}
            type="button"
            onClick={() =>
              navigate("/litigation?stage=" + encodeURIComponent(stage.stage))
            }
            className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <span className="w-44 shrink-0 truncate text-sm">{stage.stage}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: (stage.count / peak) * 100 + "%" }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-sm font-semibold">
              {stage.count}
            </span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
