import { AlertTriangle, Calculator, Clock4, Car, Timer } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const metricCards = (analysis) => {
  const settlement = analysis?.settlement_summary || {};
  return [
    { label: "Driving time", value: settlement.total_drive_minutes, suffix: "min", icon: Car, testId: "settlement-driving-minutes" },
    { label: "Waiting time", value: settlement.total_wait_minutes, suffix: "min", icon: Timer, testId: "settlement-waiting-minutes" },
    { label: "Afregnet min.", value: settlement.afregnet_minutes, suffix: "min", icon: Clock4, testId: "settlement-afregnet-minutes" },
    { label: "Ønsket afregnet", value: settlement.desired_minutes, suffix: "min", icon: Calculator, testId: "settlement-oensket-minutes" },
    { label: "Difference", value: settlement.difference_minutes, suffix: "min", icon: AlertTriangle, testId: "settlement-difference-minutes" },
  ];
};

export const RunExplanationPanel = ({ analysis }) => {
  const cards = metricCards(analysis);
  const delaySummary = analysis?.delay_summary || {};
  const delays = delaySummary.stop_delay_analysis || [];
  const mainDelay = delaySummary.main_delay;

  return (
    <div className="space-y-6">
      <Card className="border-border/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Settlement summary from V.LØBE SLUT</CardTitle>
              <p className="text-sm text-muted-foreground">Driving and waiting totals are extracted only from the final run summary block.</p>
            </div>
            <Badge variant="outline">Summary source: final V.LØBE SLUT</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums" data-testid={card.testId}>
                        {card.value ?? "--"} {card.value !== undefined && card.value !== null ? card.suffix : ""}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/90 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Delay analysis</CardTitle>
              <p className="text-sm text-muted-foreground">Planned WebTrack stop times are compared against estimated actual GPS stop timing and movement.</p>
            </div>
            {mainDelay ? (
              <Badge variant="secondary" data-testid="delay-main-summary">
                Stop {mainDelay.stop_number}: {mainDelay.delay_only_minutes} min • {mainDelay.reason}
              </Badge>
            ) : (
              <Badge variant="outline" data-testid="delay-main-summary">No major delay detected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4 text-sm text-muted-foreground">
            {mainDelay ? (
              <>
                <p className="font-medium text-foreground">Main delay explanation</p>
                <p className="mt-2">
                  Delay is estimated at stop <span className="font-semibold text-foreground">{mainDelay.stop_number}</span> ({mainDelay.stop_type}) with about <span className="font-semibold text-foreground">{mainDelay.delay_only_minutes} minutes</span> of delay.
                </p>
                <p className="mt-1">Reason: {mainDelay.reason}. Confidence: {mainDelay.confidence}. Basis: {mainDelay.reason_basis}.</p>
              </>
            ) : (
              <p>No stop exceeded the delay threshold using the current GPS + WebTrack comparison logic.</p>
            )}
          </div>

          <Table data-testid="delay-analysis-table">
            <TableHeader>
              <TableRow>
                <TableHead>Stop</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Planned</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Delay</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delays.length ? (
                delays.map((delay, index) => (
                  <TableRow key={`${delay.stop_number}-${delay.planned_time}-${index}`}>
                    <TableCell className="font-medium">{delay.stop_number}</TableCell>
                    <TableCell>{delay.stop_type}</TableCell>
                    <TableCell className="font-mono text-xs">{delay.planned_time || "Ikke oplyst"}</TableCell>
                    <TableCell className="font-mono text-xs">{delay.actual_time || "Ikke oplyst"}</TableCell>
                    <TableCell>{delay.delay_minutes ?? "--"} min</TableCell>
                    <TableCell>{delay.reason}</TableCell>
                    <TableCell>
                      <Badge variant={delay.confidence === "high" ? "secondary" : "outline"}>{delay.confidence}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                    No stop-level timing analysis available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
