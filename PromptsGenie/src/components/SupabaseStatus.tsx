import React, { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { EDGE_FUNCTION_NAME } from "../services/supabasePrompt";

const SupabaseStatus: React.FC = () => {
  const [envOk, setEnvOk] = useState<boolean>(false);
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    setEnvOk(Boolean(url && key));
  }, []);

  useEffect(() => {
    const shouldPing = (import.meta.env.VITE_SUPABASE_STATUS_PING ?? (import.meta.env.DEV ? "true" : "false")) === "true";
    if (!envOk || !supabase) {
      setReachable(false);
      return;
    }
    if (!shouldPing) {
      setReachable(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    supabase.functions
      .invoke(EDGE_FUNCTION_NAME, { body: { prompt: "[healthcheck]" } })
      .then(({ data, error }) => {
        if (cancelled) return;
        // If we got any response (data or error), the function is reachable
        if (data || error) {
          setReachable(true);
        } else {
          setReachable(false);
        }
      })
      .catch(() => {
        if (!cancelled) setReachable(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [envOk]);

  const stateText = !envOk
    ? "Misconfigured"
    : checking
    ? "Checking..."
    : reachable === true
    ? "OK"
    : reachable === false
    ? "Unreachable"
    : "Idle";

  const badgeCls = !envOk
    ? "bg-red-200 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-200"
    : reachable === true
    ? "bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200"
    : reachable === false
    ? "bg-red-200 text-red-900 border-red-300 dark:bg-red-900/40 dark:text-red-200"
    : "bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200";

  return (
    <div className="ml-auto flex items-center gap-2">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${badgeCls}`}
        title={`Supabase client ${envOk ? "configured" : "missing"}`}
      >
        Supabase: {stateText}
      </span>
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-panel-secondary dark:bg-dark-panel-secondary text-text-secondary dark:text-dark-text-secondary border-border dark:border-dark-border"
        title="Configured edge function name"
      >
        {EDGE_FUNCTION_NAME}
      </span>
    </div>
  );
};

export default SupabaseStatus;