import { CheckCircle2, Clock3, FileSearch, MapPinned } from "lucide-react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";

const STEP_META = {
  upload: { label: "1. Upload files", icon: FileSearch },
  home: { label: "2. Set home zone", icon: MapPinned },
  parameters: { label: "3. Parameters", icon: Clock3 },
  review: { label: "4. Run & review", icon: CheckCircle2 },
};

export const WorkflowStepper = ({ value, onValueChange, steps }) => {
  return (
    <div className="space-y-3" data-testid="workflow-stepper">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-[hsl(var(--surface-2))] p-2">
        {steps.map((step) => {
          const Icon = STEP_META[step.key].icon;
          return (
            <TabsTrigger
              key={step.key}
              value={step.key}
              disabled={step.disabled}
              onClick={() => !step.disabled && onValueChange(step.key)}
              className="flex min-h-[64px] flex-col items-start gap-1 rounded-xl border border-transparent px-3 py-3 text-left data-[state=active]:border-border data-[state=active]:bg-card"
              data-testid={step.testId}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold tracking-tight sm:text-sm">{STEP_META[step.key].label}</span>
                </div>
                {step.complete ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" /> : null}
              </div>
              <span className="text-left text-[11px] text-muted-foreground sm:text-xs">{step.description}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`h-1.5 rounded-full ${step.complete || value === step.key ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
    </div>
  );
};
