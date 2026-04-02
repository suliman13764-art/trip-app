import { useMemo } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Flag, Home, Route } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const createDivIcon = (color, label) =>
  L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:${color};color:white;border:2px solid white;box-shadow:0 10px 24px rgba(15,23,42,0.16);font-size:12px;font-weight:700;">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const departIcon = createDivIcon("hsl(43 74% 52%)", "D");
const returnIcon = createDivIcon("hsl(186 72% 28%)", "R");
const estimatedIcon = createDivIcon("hsl(210 10% 45%)", "E");
const homeIcon = createDivIcon("hsl(186 72% 28%)", "H");

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(event) {
      onMapClick({ lat: event.latlng.lat, lon: event.latlng.lng, label: "Map-selected home zone" });
    },
  });

  return null;
};

const MapAutoFit = ({ points, homeCenter }) => {
  const map = useMap();

  useMemo(() => {
    const latLngs = [];
    points.forEach((point) => latLngs.push([point.latitude, point.longitude]));
    if (homeCenter) {
      latLngs.push([homeCenter.lat, homeCenter.lon]);
    }
    if (latLngs.length > 1) {
      map.fitBounds(latLngs, { padding: [28, 28] });
    } else if (homeCenter) {
      map.setView([homeCenter.lat, homeCenter.lon], 13);
    }
  }, [map, points, homeCenter]);

  return null;
};

export const LeafletMapPanel = ({ homeCenter, radius, analysis, onMapClick, highlightedSegmentIndex }) => {
  const routePoints = analysis?.gps_points_for_map || [];
  const routePositions = routePoints.map((point) => [point.latitude, point.longitude]);
  const segments = analysis?.segments || [];
  const highlightedSegment = highlightedSegmentIndex !== null ? segments[highlightedSegmentIndex] : null;

  const highlightedPositions = useMemo(() => {
    if (!highlightedSegment) {
      return [];
    }
    const start = new Date(highlightedSegment.start_time.replace(" ", "T"));
    const end = highlightedSegment.end_time ? new Date(highlightedSegment.end_time.replace(" ", "T")) : null;
    return routePoints
      .filter((point) => {
        const current = new Date(point.timestamp.replace(" ", "T"));
        return current >= start && (!end || current <= end);
      })
      .map((point) => [point.latitude, point.longitude]);
  }, [highlightedSegment, routePoints]);

  const mapCenter = homeCenter ? [homeCenter.lat, homeCenter.lon] : [55.2296, 11.7609];

  return (
    <Card className="map-card overflow-hidden border-border/90 shadow-sm">
      <CardHeader className="border-b bg-card/100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Route map</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="map-set-home-hint">
              Click the map to set the home zone center. The route is the visual truth for departures and returns.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Route className="mr-1 h-3.5 w-3.5" />
              {routePoints.length ? `${routePoints.length} GPS points` : "Awaiting analysis"}
            </Badge>
            {homeCenter ? (
              <Badge variant="secondary">
                <Home className="mr-1 h-3.5 w-3.5" />
                {radius} m home zone
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-0" data-testid="gps-map">
        <div className="map-canvas relative h-[540px] w-full bg-[hsl(var(--surface-2))]">
          <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full" aria-label="GPS map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={onMapClick} />
            <MapAutoFit points={routePoints} homeCenter={homeCenter} />

            {homeCenter ? (
              <>
                <Marker position={[homeCenter.lat, homeCenter.lon]} icon={homeIcon}>
                  <Popup>Selected home zone center</Popup>
                </Marker>
                <Circle
                  center={[homeCenter.lat, homeCenter.lon]}
                  radius={radius}
                  pathOptions={{
                    color: "hsl(186 72% 28%)",
                    fillColor: "hsl(186 45% 92%)",
                    fillOpacity: 0.55,
                    weight: 2,
                  }}
                />
              </>
            ) : null}

            {routePositions.length ? (
              <Polyline positions={routePositions} pathOptions={{ color: "hsl(186 72% 28%)", weight: 4, opacity: 0.9 }} />
            ) : null}

            {highlightedPositions.length ? (
              <Polyline positions={highlightedPositions} pathOptions={{ color: "hsl(43 74% 52%)", weight: 6, opacity: 0.95 }} />
            ) : null}

            {segments.map((segment, index) => {
              const endIcon = segment.is_estimated_end ? estimatedIcon : returnIcon;
              return (
                <div key={`segment-markers-${segment.start_time}-${index}`}>
                  <Marker
                    position={[segment.start_point.latitude, segment.start_point.longitude]}
                    icon={departIcon}
                  >
                    <Popup>
                      <strong>Segment {index + 1} departure</strong>
                      <br />
                      {segment.start_time}
                    </Popup>
                  </Marker>
                  {segment.end_point ? (
                    <Marker position={[segment.end_point.latitude, segment.end_point.longitude]} icon={endIcon}>
                      <Popup>
                        <strong>Segment {index + 1} return</strong>
                        <br />
                        {segment.end_time}
                      </Popup>
                    </Marker>
                  ) : null}
                </div>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-[500] rounded-lg border bg-card p-3 shadow-sm">
            <div className="space-y-2 text-xs text-foreground">
              <div className="flex items-center gap-2"><span className="h-2 w-7 rounded-full bg-primary" /> Route</div>
              <div className="flex items-center gap-2"><span className="h-2 w-7 rounded-full bg-[hsl(43_74%_52%)]" /> Highlighted segment</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[hsl(186_45%_92%)] ring-2 ring-primary" /> Home zone</div>
              <div className="flex items-center gap-2"><Flag className="h-3.5 w-3.5 text-[hsl(43_74%_52%)]" /> Departure / Return markers</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
