import { CopyCheck, Files } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export const CorrectionTextPanel = ({ value, onCopy, generatedAt }) => {
  return (
    <Card className="border-border/90 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg">Movia correction request</CardTitle>
          <p className="text-sm text-muted-foreground">English UI, Danish output. Ready to copy into the Movia system.</p>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt ? <Badge variant="outline">Generated {generatedAt}</Badge> : null}
          <Button type="button" onClick={onCopy} data-testid="copy-correction-text-button">
            <CopyCheck className="h-4 w-4" />
            Copy text
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-3 text-xs text-muted-foreground">
          The text generator avoids “unknown: None”. Missing values are replaced with “Ikke oplyst” or explained in context.
        </div>
        <Textarea
          readOnly
          value={value || "Run analysis to generate the Danish correction text."}
          className="min-h-[320px] resize-none rounded-2xl border bg-card font-mono text-sm leading-6"
          data-testid="correction-request-textarea"
          aria-label="Movia correction request text"
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Files className="h-4 w-4" />
          Use the map and segments table above to verify the text before copying.
        </div>
      </CardContent>
    </Card>
  );
};
