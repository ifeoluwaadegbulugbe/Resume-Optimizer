"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSupabaseConfiguredClient } from "@/lib/config";
import { useDataStore } from "@/lib/data/store";
import { useHydrated } from "@/lib/data/use-hydrated";
import { Trash2 } from "lucide-react";

export default function SettingsPage() {
  const mounted = useHydrated();
  const configured = isSupabaseConfiguredClient();

  if (!mounted) return null;

  function clearAllData() {
    if (!confirm("Delete all resumes, job descriptions, versions, and applications stored in this browser? This cannot be undone.")) {
      return;
    }
    useDataStore.persist.clearStorage();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account & sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {configured ? (
            <p className="text-sm text-muted-foreground">Supabase is configured. Sign in to sync your data across devices.</p>
          ) : (
            <Alert>
              <AlertDescription>
                You&apos;re in guest mode — data is stored only in this browser (localStorage). To enable
                accounts and cross-device sync, add Supabase credentials to <code>.env.local</code> (see README)
                and restart the app.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Privacy & data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your resumes and job descriptions contain personal information. In guest mode they never leave this
            browser. You can permanently delete everything stored here at any time.
          </p>
          <Button variant="destructive" className="gap-2" onClick={clearAllData}>
            <Trash2 className="h-4 w-4" /> Delete all local data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
