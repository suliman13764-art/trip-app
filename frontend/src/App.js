import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "next-themes";
import axios from "axios";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "@/App.css";
import { CorrectionTextPanel } from "@/components/CorrectionTextPanel";
import { FileDropzoneCard } from "@/components/FileDropzoneCard";
import { HomeZoneControls } from "@/components/HomeZoneControls";
import { LeafletMapPanel } from "@/components/LeafletMapPanel";
import { QualityDebugPanel } from "@/components/QualityDebugPanel";
import { ResultsKPIGrid } from "@/components/ResultsKPIGrid";
import { SegmentsTable } from "@/components/SegmentsTable";
import { WorkflowStepper } from "@/components/WorkflowStepper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const previewCsvFile = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 6);
      if (!lines.length) {
        resolve(null);
        return;
      }
      const separator = [";", ",", "\t"].reduce(
        (best, candidate) => (lines[0].split(candidate).length > lines[0].split(best).length ? candidate : best),
        ","
      );
      const rows = lines.map((line) =>
        line
          .split(separator)
          .map((cell) => cell.replace(/^"|"$/g, "").trim())
          .slice(0, 5)
      );
      resolve({ headers: rows[0], rows: rows.slice(1), meta: `${separator === "\t" ? "tab" : separator}-delimited` });
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });

const searchNominatim = async (query) => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "dk");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("q", query);
  url.searchParams.set("email", "support@emergent.sh");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Address search failed. You can still click the map to set the home zone.");
  }

  return response.json();
};

function App() {
  const [activeStep, setActiveStep] = useState("upload");
  const [gpsFile, setGpsFile] = useState(null);
  const [webtrackFile, setWebtrackFile] = useState(null);
  const [gpsPreview, setGpsPreview] = useState(null);
  const [webtrackPreview, setWebtrackPreview] = useState(null);
  const [addressQuery, setAddressQuery] = useState("Marskvej 9, 4700 Næstved");
  const [addressResults, setAddressResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedHome, setSelectedHome] = useState(null);
  const [radius, setRadius] = useState(300);
  const [dwellMinutes, setDwellMinutes] = useState(10);
  const [stablePoints, setStablePoints] = useState(3);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [highlightedSegmentIndex, setHighlightedSegmentIndex] = useState(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (gpsFile && gpsFile.name.toLowerCase().endsWith(".csv")) {
      previewCsvFile(gpsFile).then(setGpsPreview);
    } else {
      setGpsPreview(null);
    }
  }, [gpsFile]);

  useEffect(() => {
    if (webtrackFile && webtrackFile.name.toLowerCase().endsWith(".csv")) {
      previewCsvFile(webtrackFile).then(setWebtrackPreview);
    } else {
      setWebtrackPreview(null);
    }
  }, [webtrackFile]);

  const stepConfig = useMemo(
    () => [
      {
        key: "upload",
        testId: "workflow-step-upload",
        description: gpsFile && webtrackFile ? "Both files attached" : "Attach GPS + WebTrack files",
        disabled: false,
        complete: Boolean(gpsFile && webtrackFile),
      },
      {
        key: "home",
        testId: "workflow-step-home-zone",
        description: selectedHome ? "Home center selected" : "Choose address or map point",
        disabled: !(gpsFile && webtrackFile),
        complete: Boolean(selectedHome),
      },
      {
        key: "parameters",
        testId: "workflow-step-parameters",
        description: "Review radius, dwell, stable points",
        disabled: !(gpsFile && webtrackFile && selectedHome),
        complete: Boolean(selectedHome),
      },
      {
        key: "review",
        testId: "workflow-step-run-review",
        description: analysis ? "Results ready" : "Run the full analysis",
        disabled: !(gpsFile && webtrackFile && selectedHome),
        complete: Boolean(analysis),
      },
    ],
    [gpsFile, webtrackFile, selectedHome, analysis]
  );

  const handleGpsFileChange = (file) => {
    setGpsFile(file);
    setAnalysis(null);
    setAnalysisError("");
    if (file) {
      toast.success("GPS file attached.");
      setActiveStep(webtrackFile ? "home" : "upload");
    }
  };

  const handleWebtrackFileChange = (file) => {
    setWebtrackFile(file);
    setAnalysis(null);
    setAnalysisError("");
    if (file) {
      toast.success("WebTrack file attached.");
      setActiveStep(gpsFile ? "home" : "upload");
    }
  };

  const handleAddressSearch = async () => {
    if (!addressQuery.trim()) {
      toast.error("Enter a home address before searching.");
      return;
    }
    setSearchLoading(true);
    try {
      const results = await searchNominatim(addressQuery.trim());
      setAddressResults(results);
      if (results.length) {
        toast.success("Address candidates loaded.");
      } else {
        toast.error("No address matches found. Try clicking the map instead.");
      }
    } catch (error) {
      toast.error(error.message || "Address search failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectAddress = (result) => {
    const nextHome = {
      lat: Number(result.lat),
      lon: Number(result.lon),
      label: result.display_name,
      source: "browser-nominatim",
    };
    setSelectedHome(nextHome);
    setActiveStep("parameters");
    toast.success("Home zone address selected.");
  };

  const buildFormData = (orderCoordinates) => {
    const formData = new FormData();
    formData.append("gps_file", gpsFile);
    formData.append("webtrack_file", webtrackFile);
    formData.append("home_lat", selectedHome.lat);
    formData.append("home_lon", selectedHome.lon);
    formData.append("radius_m", radius);
    formData.append("dwell_minutes", dwellMinutes);
    formData.append("stable_points", stablePoints);
    if (orderCoordinates?.lat && orderCoordinates?.lon) {
      formData.append("last_order_lat", orderCoordinates.lat);
      formData.append("last_order_lon", orderCoordinates.lon);
    }
    return formData;
  };

  const performAnalysis = async (orderCoordinates = null, allowOrderRetry = true) => {
    const formData = buildFormData(orderCoordinates);
    const response = await axios.post(`${API}/analyze`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const result = response.data;

    if (
      result.needs_order_geocode &&
      allowOrderRetry &&
      result.webtrack_summary?.last_order_with_address?.address &&
      !orderCoordinates
    ) {
      try {
        const [candidate] = await searchNominatim(result.webtrack_summary.last_order_with_address.address);
        if (candidate) {
          toast.info("No clear GPS return detected. Refining fallback using the last order address.");
          return performAnalysis({ lat: Number(candidate.lat), lon: Number(candidate.lon) }, false);
        }
      } catch (error) {
        toast.error("Could not geocode the last order address. Using the available fallback.");
      }
    }

    return result;
  };

  const handleRunAnalysis = async () => {
    if (!gpsFile || !webtrackFile) {
      toast.error("Please attach both files before running analysis.");
      setActiveStep("upload");
      return;
    }
    if (!selectedHome) {
      toast.error("Please select a home zone first.");
      setActiveStep("home");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setHighlightedSegmentIndex(null);

    try {
      const result = await performAnalysis();
      setAnalysis(result);
      setActiveStep("review");
      toast.success("Analysis complete.");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (error) {
      const message = error?.response?.data?.detail || error.message || "Analysis failed.";
      setAnalysisError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyCorrectionText = async () => {
    if (!analysis?.movia_correction_text) {
      toast.error("No correction text to copy yet.");
      return;
    }
    await navigator.clipboard.writeText(analysis.movia_correction_text);
    toast.success("Correction text copied to clipboard.");
  };

  const handleCopySegment = async (segment) => {
    const text = `Segment start: ${segment.start_time}\nSegment end: ${segment.end_time || "Pending"}\nConfidence: ${segment.is_estimated_end ? "Estimated" : "Exact"}`;
    await navigator.clipboard.writeText(text);
    toast.success("Segment summary copied.");
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="AppShell">
        <header className="app-header">
          <div className="noise-overlay" />
          <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                    Internal operations tool
                  </Badge>
                  <Badge variant="secondary" data-testid="timezone-label">CET/CEST local time</Badge>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Trip Segment Correction Workspace</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Upload messy GPS and WebTrack files, set the home zone, and generate a Movia-ready Danish correction request with auditable trip logic.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Logic priority</p>
                  <p className="mt-2 text-sm font-semibold">End time = first valid home-zone entry</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Reliability rule</p>
                  <p className="mt-2 text-sm font-semibold">Drive-by passes never count as a return</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <Card className="border-border/90 shadow-sm">
                <CardHeader className="space-y-4">
                  <div>
                    <CardTitle className="text-lg">Guided workflow</CardTitle>
                    <p className="text-sm text-muted-foreground">Complete each step in order for reliable correction output.</p>
                  </div>
                  <Tabs value={activeStep} onValueChange={setActiveStep}>
                    <WorkflowStepper value={activeStep} onValueChange={setActiveStep} steps={stepConfig} />
                    <TabsContent value="upload" className="mt-4 space-y-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        <FileDropzoneCard
                          title="GPS file"
                          description="CSV or Excel with timestamps, latitude and longitude."
                          accept=".csv,.xlsx,.xls"
                          file={gpsFile}
                          onFileChange={handleGpsFileChange}
                          preview={gpsPreview}
                          emptyMessage="Upload the GPS export first."
                          inputTestId="gps-file-input"
                          previewTestId="gps-preview-table"
                          variant="gps"
                        />
                        <FileDropzoneCard
                          title="WebTrack report"
                          description="Messy Excel or PDF report-style export."
                          accept=".pdf,.csv,.xlsx,.xls"
                          file={webtrackFile}
                          onFileChange={handleWebtrackFileChange}
                          preview={webtrackPreview}
                          emptyMessage="Upload the WebTrack report next."
                          inputTestId="webtrack-file-input"
                          previewTestId="webtrack-preview-table"
                          variant="webtrack"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="home" className="mt-4">
                      <HomeZoneControls
                        addressQuery={addressQuery}
                        onAddressQueryChange={setAddressQuery}
                        onSearch={handleAddressSearch}
                        searchLoading={searchLoading}
                        searchResults={addressResults}
                        onSelectAddress={handleSelectAddress}
                        radius={radius}
                        onRadiusChange={setRadius}
                        dwellMinutes={dwellMinutes}
                        onDwellMinutesChange={setDwellMinutes}
                        stablePoints={stablePoints}
                        onStablePointsChange={setStablePoints}
                        selectedHome={selectedHome}
                      />
                    </TabsContent>
                    <TabsContent value="parameters" className="mt-4 space-y-4">
                      <Card className="border-border/90 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-lg">Detection parameters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                          <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                            <p className="font-medium text-foreground">Current setup</p>
                            <ul className="mt-3 space-y-2">
                              <li>• Radius: {radius} meters</li>
                              <li>• Return dwell: {dwellMinutes} minutes</li>
                              <li>• Stable inside/outside streak: {stablePoints} points</li>
                              <li>• Timezone reference: CET/CEST local time</li>
                            </ul>
                          </div>
                          <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertTitle>Core rule lock</AlertTitle>
                            <AlertDescription>
                              End time is always based on the first valid re-entry into the home zone, never the last GPS point unless marked as a fallback.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="review" className="mt-4 space-y-4">
                      <Card className="border-border/90 shadow-sm">
                        <CardHeader className="space-y-3">
                          <CardTitle className="text-lg">Run & review</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            The backend combines GPS and WebTrack logic, then returns the Movia-ready Danish explanation text.
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                              type="button"
                              onClick={handleRunAnalysis}
                              disabled={isAnalyzing}
                              className="sm:min-w-[180px]"
                              data-testid="run-analysis-button"
                            >
                              {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                              {isAnalyzing ? "Running analysis..." : "Run analysis"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleCopyCorrectionText}
                              data-testid="generate-correction-text-button"
                            >
                              <Copy className="h-4 w-4" />
                              Copy latest text
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Files in scope</p>
                              <p className="mt-2 text-sm font-medium">{gpsFile?.name || "No GPS file"}</p>
                              <p className="text-sm font-medium">{webtrackFile?.name || "No WebTrack file"}</p>
                            </div>
                            <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Selected home zone</p>
                              <p className="mt-2 text-sm font-medium">{selectedHome?.label || "No home zone selected"}</p>
                              {selectedHome ? (
                                <p className="mt-1 font-mono text-xs text-muted-foreground">
                                  {selectedHome.lat.toFixed(6)}, {selectedHome.lon.toFixed(6)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          {analysisError ? (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Analysis failed</AlertTitle>
                              <AlertDescription>{analysisError}</AlertDescription>
                            </Alert>
                          ) : null}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardHeader>
              </Card>

              {analysis ? <QualityDebugPanel analysis={analysis} /> : null}
            </div>

            <div className="space-y-6 lg:col-span-7">
              <LeafletMapPanel
                homeCenter={selectedHome}
                radius={radius}
                analysis={analysis}
                onMapClick={setSelectedHome}
                highlightedSegmentIndex={highlightedSegmentIndex}
              />

              {!analysis ? (
                <Card className="border-border/90 shadow-sm">
                  <CardContent className="flex flex-col gap-3 p-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground"><MapPin className="h-4 w-4" /> Map guidance</div>
                    <p>1. Upload both files.</p>
                    <p>2. Search the home address or click the map.</p>
                    <p>3. Run analysis to render the route, entry points, and return markers.</p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>

          <div ref={resultsRef} className="section-anchor mt-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Results overview</h2>
                  <p className="text-sm text-muted-foreground">These values update from the proven backend analysis engine.</p>
                </div>
                {analysis?.upload_summary ? (
                  <Badge variant="outline">
                    <FileText className="mr-1 h-3.5 w-3.5" />
                    {analysis.upload_summary.gps_filename} + {analysis.upload_summary.webtrack_filename}
                  </Badge>
                ) : null}
              </div>
              <ResultsKPIGrid analysis={analysis} />
            </motion.div>

            <Separator />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <SegmentsTable
                  analysis={analysis}
                  highlightedSegmentIndex={highlightedSegmentIndex}
                  onHighlightSegment={setHighlightedSegmentIndex}
                  onCopySegment={handleCopySegment}
                />
              </div>
              <div className="xl:col-span-4">
                <CorrectionTextPanel
                  value={analysis?.movia_correction_text || ""}
                  onCopy={handleCopyCorrectionText}
                  generatedAt={analysis ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                />
              </div>
            </div>
          </div>
        </main>
        <Toaster richColors position="top-right" />
      </div>
    </ThemeProvider>
  );
}

export default App;
