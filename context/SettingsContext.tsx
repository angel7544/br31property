"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

interface Settings {
  siteName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  logoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  currencySymbol: string;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  siteName: "BR31 PROERTYMANAGEMENT SYSTEM",
  contactEmail: "",
  contactPhone: "",
  address: "",
  currency: "INR",
  logoUrl: "",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();
      if (data) {
        setSettings({
          siteName: data.site_name || "BR31 PROERTYMANAGEMENT SYSTEM",
          contactEmail: data.contact_email || "",
          contactPhone: data.contact_phone || "",
          address: data.address || "",
          currency: data.currency || "INR",
          logoUrl: data.logo_url || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 3000);
    return () => clearInterval(interval);
  }, []);

  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "JPY": return "¥";
      case "GBP": return "£";
      case "INR": return "₹";
      default: return "$";
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      currencySymbol: getCurrencySymbol(settings.currency), 
      loading,
      refreshSettings: fetchSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
