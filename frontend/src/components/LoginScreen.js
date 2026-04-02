import { LockKeyhole, LogIn } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LoginScreen = ({ username, password, onUsernameChange, onPasswordChange, onSubmit, error, isSubmitting }) => {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border bg-card p-8 shadow-sm lg:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">Internal access only</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Trip Segment Correction Workspace</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Log in with your internal username to access GPS/WebTrack analysis, private-trip handling, and the Movia correction workflow.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Protected actions</p>
                <p className="mt-2 text-sm font-semibold">Analysis is available only to authenticated users.</p>
              </div>
              <div className="rounded-2xl border bg-[hsl(var(--surface-2))] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Admin controls</p>
                <p className="mt-2 text-sm font-semibold">Only Owner/Admin can create or deactivate users.</p>
              </div>
            </div>
          </div>

          <Card className="border-border/90 shadow-sm">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-2xl">Log in</CardTitle>
              <CardDescription>Use the seeded owner account or an admin-created user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input id="login-username" value={username} onChange={(event) => onUsernameChange(event.target.value)} data-testid="login-username-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} data-testid="login-password-input" />
              </div>
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Login failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <Button type="button" onClick={onSubmit} disabled={isSubmitting} className="w-full" data-testid="login-submit-button">
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "Signing in..." : "Log in"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
