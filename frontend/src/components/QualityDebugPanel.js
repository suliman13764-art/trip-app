import { AlertTriangle, GaugeCircle, ListChecks, Waypoints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const QualityDebugPanel = ({ analysis }) => {
  const runs = analysis?.segment_debug?.runs || [];
  const rejected = analysis?.segment_debug?.rejected_returns || [];

  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Quality & debug</CardTitle>
            <p className="text-sm text-muted-foreground">Use this to explain why the system chose the final end time.</p>
          </div>
          <Badge variant="outline" data-testid="debug-closest-distance">
            Closest distance: {analysis?.segment_debug?.closest_distance_m ?? "--"} m
          </Badge>
        </div>
      </CardHeader>
      <CardContent data-testid="debug-tabs">
        <Tabs defaultValue="quality">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl p-1">
            <TabsTrigger value="quality">Quality checks</TabsTrigger>
            <TabsTrigger value="detections">Raw detections</TabsTrigger>
            <TabsTrigger value="distances">Distances</TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><GaugeCircle className="h-4 w-4" /> Confidence summary</div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• End time basis: {analysis?.end_time_basis_label || "Not available"}</li>
                  <li>• Radius: {analysis?.home_center?.radius_meters || "--"} m</li>
                  <li>• Stable points: {analysis?.home_center?.stable_point_count || "--"}</li>
                  <li>• Dwell rule: {analysis?.home_center?.return_dwell_minutes || "--"} minutes</li>
                </ul>
              </div>
              <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4" /> Warnings</div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {analysis?.needs_order_geocode ? <li>• Browser geocoding can refine the last-order fallback if GPS return is missing.</li> : null}
                  {analysis?.estimation_note ? <li>• {analysis.estimation_note}</li> : <li>• No estimation warning for this analysis.</li>}
                  {!rejected.length ? <li>• No rejected return streaks for this run.</li> : null}
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detections" className="mt-4">
            <ScrollArea className="h-[320px] rounded-2xl border">
              <div className="space-y-4 p-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><ListChecks className="h-4 w-4" /> Rejected return streaks</div>
                  {rejected.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {rejected.map((item, index) => (
                        <li key={`${item.candidate_entry_time}-${index}`}>• {item.candidate_entry_time}: {item.reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No rejected return streaks were found.</p>
                  )}
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Waypoints className="h-4 w-4" /> Last meaningful WebTrack event</div>
                  <p className="text-sm text-muted-foreground">{analysis?.webtrack_summary?.last_meaningful_event_text || "Not available"}</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="distances" className="mt-4">
            <ScrollArea className="h-[320px] rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Min distance</TableHead>
                    <TableHead>Max distance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run, index) => (
                    <TableRow key={`${run.start}-${index}`}>
                      <TableCell>{run.inside ? "Inside" : "Outside"}</TableCell>
                      <TableCell className="font-mono text-xs">{run.start}</TableCell>
                      <TableCell className="font-mono text-xs">{run.end}</TableCell>
                      <TableCell>{run.point_count}</TableCell>
                      <TableCell>{run.duration_seconds}s</TableCell>
                      <TableCell>{run.min_distance_m} m</TableCell>
                      <TableCell>{run.max_distance_m} m</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
