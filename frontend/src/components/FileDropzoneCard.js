import { FileSpreadsheet, FileText, UploadCloud } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const FileDropzoneCard = ({
  title,
  description,
  accept,
  file,
  onFileChange,
  preview,
  emptyMessage,
  inputTestId,
  previewTestId,
  variant = "gps",
}) => {
  const Icon = variant === "gps" ? FileSpreadsheet : FileText;

  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant={file ? "default" : "secondary"}>{file ? "Ready" : "Required"}</Badge>
        </div>
        <label className="flex min-h-[152px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-[hsl(var(--surface-2))] px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent/60">
          <UploadCloud className="h-8 w-8 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Choose or drop a file</p>
            <p className="text-xs text-muted-foreground">Accepted: {accept.replaceAll(",", ", ")}</p>
          </div>
          <Input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            data-testid={inputTestId}
          />
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        {file ? (
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{file.name}</Badge>
              <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
              <Badge variant="outline">{file.type || "Local file"}</Badge>
            </div>
          </div>
        ) : (
          <Alert>
            <UploadCloud className="h-4 w-4" />
            <AlertTitle>Waiting for file</AlertTitle>
            <AlertDescription>{emptyMessage}</AlertDescription>
          </Alert>
        )}

        {preview?.headers?.length ? (
          <div className="rounded-2xl border bg-card p-3" data-testid={previewTestId}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Preview</p>
                <p className="text-xs text-muted-foreground">Local read-only preview of the first rows</p>
              </div>
              {preview?.meta ? <Badge variant="outline">{preview.meta}</Badge> : null}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row, rowIndex) => (
                  <TableRow key={`row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`cell-${rowIndex}-${cellIndex}`} className="max-w-[180px] truncate">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : file ? (
          <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4 text-sm text-muted-foreground">
            Full parsing validation will run during analysis. Local preview is available for plain-text CSV files.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
