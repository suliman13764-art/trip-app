import { useMemo, useState } from "react";
import { CarFront, ScissorsLineDashed, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const PrivateTripManager = ({ analysis, privateTrips, setPrivateTrips, onApply, isApplying }) => {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const analysisDate = analysis?.gps_summary?.date;
  const totalPrivateMinutes = useMemo(
    () =>
      privateTrips.reduce((sum, trip) => {
        const [startHour, startMinute] = trip.start_time.split(":").map(Number);
        const [endHour, endMinute] = trip.end_time.split(":").map(Number);
        return sum + Math.max(0, endHour * 60 + endMinute - (startHour * 60 + startMinute));
      }, 0),
    [privateTrips]
  );

  const addTrip = () => {
    if (!startTime || !endTime || endTime <= startTime) {
      return;
    }
    setPrivateTrips([
      ...privateTrips,
      {
        id: `${startTime}-${endTime}`,
        start_time: startTime,
        end_time: endTime,
        notes,
        source: "manual",
        confidence: "confirmed",
      },
    ]);
    setStartTime("");
    setEndTime("");
    setNotes("");
  };

  const removeTrip = (tripId) => setPrivateTrips(privateTrips.filter((trip) => trip.id !== tripId));

  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Private trip handling</CardTitle>
          <p className="text-sm text-muted-foreground">Add confirmed private trip intervals so they are excluded from work time and split segments correctly.</p>
        </div>
        <Badge variant="outline">Excluded private time: {totalPrivateMinutes} min</Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 rounded-2xl border bg-[hsl(var(--surface-2))] p-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="private-trip-start">Start time</Label>
            <Input id="private-trip-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} data-testid="private-trip-start-input" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="private-trip-end">End time</Label>
            <Input id="private-trip-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} data-testid="private-trip-end-input" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="private-trip-notes">Notes</Label>
            <Input id="private-trip-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional reason or confirmation note" data-testid="private-trip-notes-input" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={addTrip} data-testid="private-trip-add-button">
            <ScissorsLineDashed className="h-4 w-4" />
            Add private trip
          </Button>
          <Button type="button" onClick={onApply} disabled={!analysisDate || isApplying} data-testid="private-trip-apply-button">
            <CarFront className="h-4 w-4" />
            {isApplying ? "Recalculating..." : "Recalculate with private trips"}
          </Button>
        </div>

        <div className="space-y-3">
          {privateTrips.length ? (
            privateTrips.map((trip) => (
              <div key={trip.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">Private trip {trip.start_time}–{trip.end_time}</p>
                  <p className="text-xs text-muted-foreground">{trip.notes || "No note"} • Source: manual</p>
                  {analysisDate ? <p className="font-mono text-xs text-muted-foreground">Applied on {analysisDate}</p> : null}
                </div>
                <Button type="button" variant="ghost" onClick={() => removeTrip(trip.id)} data-testid={`private-trip-remove-${trip.id}`}>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              No private trips added yet. For v1, manual confirmation is the safe way to exclude private travel time.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
