/**
 * OAuth consent screen for MCP client authorizations.
 * Mounted at /.lovable/oauth/consent — Supabase's OAuth 2.1 authorization
 * server redirects here to have the user approve or deny a connecting MCP
 * client (ChatGPT, Claude, Cursor, etc.).
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// The oauth namespace is beta in supabase-js — declare a minimal typed wrapper.
type OAuthClient = { name?: string; client_uri?: string; logo_uri?: string };
type AuthorizationDetails = {
  client?: OAuthClient;
  scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function oauth(): OAuthApi {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthApi;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so /auth returns the user here after login.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load authorization");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth().approveAuthorization(authorizationId)
        : await oauth().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message);
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError("No redirect returned by the authorization server.");
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "Authorization failed");
    }
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-6 space-y-3">
          <h1 className="text-xl font-semibold">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "An application";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-6 space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Connect {clientName} to Planik</h1>
          <p className="text-sm text-muted-foreground">
            {clientName} is requesting access to act on your behalf. It will be able to use the
            Planik tools you have access to — reading your workouts, personal records, and diet
            log, and adding new entries.
          </p>
        </div>
        {details.scopes && details.scopes.length > 0 && (
          <ul className="text-sm list-disc pl-5 space-y-1">
            {details.scopes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
            Approve
          </Button>
          <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
            Deny
          </Button>
        </div>
      </Card>
    </main>
  );
}
