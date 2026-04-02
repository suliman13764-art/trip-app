import { Clock3, Flag, Route, TimerReset } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const KPI_ITEMS = [
  { key: "start", label: "Start time", testId: "kpi-start-time", icon: Clock3 },
  { key: "end", label: "End time", testId: "kpi-end-time", icon: TimerReset },
  { key: "total", label: "Total working time", testId: "kpi-total-working-time", icon: Route },
  { key: "segments", label: "Segments", testId: "kpi-segments-count", icon: Flag },
];

export const ResultsKPIGrid = ({ analysis }) => {
  const values = {
    start: analysis?.computed_start_time || "--:--",
    end: analysis?.computed_end_time || "--:--",
    total: analysis?.total_work_minutes ? `${analysis.total_work_minutes} min` : "Not ready",
    segments: analysis?.segment_count ?? 0,
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const estimated = item.key === "end" && analysis?.end_time_basis_label === "Estimeret sluttid";
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: index * 0.04 }}
          >
            <Card className="border-border/90 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums" data-testid={item.testId}>
                      {values[item.key]}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={estimated ? "secondary" : "outline"}>{estimated ? "Estimated" : "Exact"}</Badge>
                  {item.key === "end" ? <span className="text-xs text-muted-foreground">{analysis?.end_time_basis_label}</span> : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};
