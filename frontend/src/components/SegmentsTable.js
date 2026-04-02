import { Copy, Map, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const durationBetween = (start, end) => {
  if (!start || !end) return "Pending";
  const startDate = new Date(start.replace(" ", "T"));
  const endDate = new Date(end.replace(" ", "T"));
  const minutes = Math.max(0, Math.round((endDate - startDate) / 60000));
  return `${minutes} min`;
};

export const SegmentsTable = ({ analysis, onHighlightSegment, highlightedSegmentIndex, onCopySegment }) => {
  const segments = analysis?.segments || [];

  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Segments table</CardTitle>
          <p className="text-sm text-muted-foreground">Review every departure / return pair before copying the correction request.</p>
        </div>
        <Badge variant="secondary">{segments.length} segment(s)</Badge>
      </CardHeader>
      <CardContent>
        <div data-testid="segments-table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment #</TableHead>
                <TableHead>Depart</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Run #</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.length ? (
                segments.map((segment, index) => (
                  <TableRow key={`${segment.start_time}-${index}`} className={highlightedSegmentIndex === index ? "bg-accent/60" : undefined}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{segment.start_time}</TableCell>
                    <TableCell className="font-mono text-xs">{segment.end_time || "Awaiting end"}</TableCell>
                    <TableCell>{durationBetween(segment.start_time, segment.end_time)}</TableCell>
                    <TableCell>{analysis?.webtrack_summary?.stop_numbers?.join(", ") || "Ikke oplyst"}</TableCell>
                    <TableCell className="font-mono text-xs">{analysis?.webtrack_summary?.primary_run_number || "Ikke oplyst"}</TableCell>
                    <TableCell>
                      <Badge variant={segment.is_estimated_end ? "secondary" : "outline"}>
                        {segment.is_estimated_end ? "Estimated" : "Exact"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant={highlightedSegmentIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => onHighlightSegment(index)}
                          data-testid="segment-highlight-button"
                        >
                          <Map className="h-4 w-4" />
                          Highlight
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => onCopySegment(segment)}>
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Run analysis to populate segments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
