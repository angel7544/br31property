"use client";

import { CreditCard, CheckCircle2, Loader2, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const roles = (user.app_metadata?.roles as string[]) || [];
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
        
        if (roles.includes('owner') || roles.includes('admin') || profile?.role === 'owner' || profile?.role === 'admin') {
          setIsOwner(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);
      
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Failed to load payment gateway");
        setUpgrading(false);
        return;
      }

      // 1. Create Order
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
      });
      const orderData = await orderRes.json();
      
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      // 2. Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PG Dekho",
        description: "Owner Plan Upgrade",
        image: "https://your-logo-url.com/logo.png", // Optional
        order_id: orderData.id,
        handler: async function (response: any) {
            try {
                // 3. Verify Payment & Upgrade
                const verifyRes = await fetch("/api/subscription/upgrade", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    }),
                });

                const verifyData = await verifyRes.json();

                if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

                toast.success("Payment successful! You are now an Owner.");
                setIsOwner(true);
                await supabase.auth.refreshSession();
                router.refresh();

            } catch (err: any) {
                toast.error(err.message || "Upgrade failed after payment");
                console.error(err);
            }
        },
        prefill: {
            name: user?.user_metadata?.full_name || "",
            email: user?.email || "",
            contact: user?.phone || "",
        },
        theme: {
            color: "#7c3aed",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed");
      });
      rzp1.open();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscription</h1>
        <p className="text-gray-500">Manage your plan and billing details</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan Card */}
        <div className={`bg-white rounded-2xl p-8 border-2 transition-all ${!isOwner ? 'border-blue-500 shadow-lg ring-4 ring-blue-50' : 'border-gray-100 opacity-60'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Tenant / Free</h3>
              <p className="text-gray-500 text-sm mt-1">Basic access for seekers</p>
            </div>
            {!isOwner && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">CURRENT</span>}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-6">₹0<span className="text-base font-normal text-gray-500">/forever</span></div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Search unlimited properties</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Contact owners directly</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Save to wishlist</span>
            </li>
          </ul>
        </div>

        {/* Owner Plan Card */}
        <div className={`bg-white rounded-2xl p-8 border-2 transition-all relative overflow-hidden ${isOwner ? 'border-purple-500 shadow-lg ring-4 ring-purple-50' : 'border-purple-100 hover:border-purple-300'}`}>
          {isOwner && (
            <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
              ACTIVE
            </div>
          )}
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Owner Plan <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              </h3>
              <p className="text-gray-500 text-sm mt-1">For property owners</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-6">₹999<span className="text-base font-normal text-gray-500">/one-time</span></div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span>List unlimited properties</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span>Access Owner Dashboard</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span>Manage bookings & tenants</span>
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span>Priority Support</span>
            </li>
          </ul>

          {isOwner ? (
            <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Plan Active
            </button>
          ) : (
            <button 
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {upgrading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade Now
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
