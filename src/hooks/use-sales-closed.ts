import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { fetchRegistrationSettings } from "@/lib/registration-settings";
import { useEffect, useState } from "react";

export const useSalesClosed = (): { salesClosed: boolean; loading: boolean } => {
  const [salesClosed, setSalesClosed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void fetchRegistrationSettings()
      .then((settings) => {
        if (active) {
          setSalesClosed(settings.salesClosed);
        }
      })
      .catch((error) => {
        console.error("[RegistrationSettings] Erro ao carregar configurações públicas:", error);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { salesClosed, loading };
};
