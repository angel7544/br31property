"use client";
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
  const [settings, setSettings] = useState({
    siteName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    currency: "USD",
    logoUrl: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("settings").select("*").eq("id", "default").maybeSingle();
      if (data) {
        setSettings({
          siteName: data.site_name || "BR31 PROERTYMANAGEMENT SYSTEM",
          contactEmail: data.contact_email || "",
          contactPhone: data.contact_phone || "",
          address: data.address || "",
          currency: data.currency || "USD",
          logoUrl: data.logo_url || "",
        });
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let uploadedUrl = settings.logoUrl;
    try {
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "br31/settings");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || "Upload failed");
        }
        const json = await res.json();
        if (json.ok) uploadedUrl = json.url;
        else throw new Error(json.error || "Upload failed");
      }
    } catch (e: any) {
      console.error(e);
      addToast(`Failed to upload logo: ${e.message}`, "error");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const payload = {
      id: "default",
      site_name: settings.siteName,
      contact_email: settings.contactEmail,
      contact_phone: settings.contactPhone,
      address: settings.address,
      currency: settings.currency,
      logo_url: uploadedUrl,
      updated_at: new Date().toISOString(),
    };
    
    // Check if row exists first to decide on insert or update if upsert fails for some reason
    // actually upsert is best.
    const { error } = await supabase.from("settings").upsert(payload, { onConflict: 'id' });
    
    setLoading(false);
    if (error) {
      console.error("Settings save error:", error);
      addToast(`Failed to save settings: ${error.message}`, "error");
    } else {
      addToast("Settings saved successfully", "success");
      // Update local state to show new image immediately if needed
      setSettings(prev => ({ ...prev, logoUrl: uploadedUrl }));
      // Optionally reload to reflect changes globally if using context
      window.location.reload(); 
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Note: Invoices functionality has been disabled by the developer.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Site Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="siteName"
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
               <label className="block text-sm font-medium text-gray-700">Logo</label>
               <div className="mt-1 flex items-center space-x-4">
                 {settings.logoUrl && (
                    <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto" />
                 )}
                 <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-base sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
               </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Contact Email
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Contact Phone
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <div className="mt-1">
                <select
                  id="currency"
                  name="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base sm:text-sm border-gray-300 rounded-md py-2 px-3"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Settings"}
                {!loading && <Save className="ml-2 -mr-1 h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
