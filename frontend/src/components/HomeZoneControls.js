import { Search, MapPinHouse, Crosshair } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const HomeZoneControls = ({
  addressQuery,
  onAddressQueryChange,
  onSearch,
  searchLoading,
  searchResults,
  onSelectAddress,
  radius,
  onRadiusChange,
  dwellMinutes,
  onDwellMinutesChange,
  stablePoints,
  onStablePointsChange,
  selectedHome,
}) => {
  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">Home zone controls</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search the address in the browser with Nominatim, then fine-tune by clicking the map.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="home-address-search">Home address</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="home-address-search"
              value={addressQuery}
              onChange={(event) => onAddressQueryChange(event.target.value)}
              placeholder="Marskvej 9, 4700 Næstved"
              data-testid="home-address-search-input"
            />
            <Button
              type="button"
              onClick={onSearch}
              disabled={searchLoading || !addressQuery.trim()}
              className="sm:min-w-[132px]"
              data-testid="home-address-search-button"
            >
              <Search className="h-4 w-4" />
              {searchLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-2" data-testid="home-address-search-results">
          <Command>
            <CommandList>
              <CommandEmpty>No address results yet.</CommandEmpty>
              <CommandGroup heading="Address results">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.place_id}
                    value={`${result.display_name}-${result.place_id}`}
                    onSelect={() => onSelectAddress(result)}
                    className="flex items-start justify-between gap-3 rounded-xl px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{result.display_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {Number(result.lat).toFixed(5)}, {Number(result.lon).toFixed(5)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectAddress(result);
                      }}
                      data-testid="home-address-use-button"
                    >
                      Use
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Home radius</p>
                <p className="text-xs text-muted-foreground">200–500 meters, default 300</p>
              </div>
              <Badge variant="outline" data-testid="home-zone-radius-value">
                {radius} m
              </Badge>
            </div>
            <Slider
              value={[radius]}
              min={200}
              max={500}
              step={10}
              className="mt-5"
              onValueChange={(values) => onRadiusChange(values[0])}
              data-testid="home-zone-radius-slider"
            />
          </div>

          <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dwell-minutes">Return dwell (minutes)</Label>
                <Input
                  id="dwell-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={dwellMinutes}
                  onChange={(event) => onDwellMinutesChange(Number(event.target.value) || 10)}
                  data-testid="home-zone-dwell-minutes-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stable-points">Stable detection points</Label>
                <Input
                  id="stable-points"
                  type="number"
                  min={2}
                  max={5}
                  value={stablePoints}
                  onChange={(event) => onStablePointsChange(Number(event.target.value) || 3)}
                  data-testid="stable-points-input"
                />
              </div>
            </div>
          </div>
        </div>

        {selectedHome ? (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                <MapPinHouse className="mr-1 h-3.5 w-3.5" />
                Selected home zone
              </Badge>
              <Badge variant="outline">
                <Crosshair className="mr-1 h-3.5 w-3.5" />
                Click map to adjust
              </Badge>
            </div>
            <p className="mt-3 text-sm font-medium">{selectedHome.label || "Map-selected location"}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {selectedHome.lat.toFixed(6)}, {selectedHome.lon.toFixed(6)}
            </p>
          </div>
        ) : (
          <Alert>
            <MapPinHouse className="h-4 w-4" />
            <AlertTitle>No home zone selected yet</AlertTitle>
            <AlertDescription>
              Search an address or click the map to define the home zone center.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
