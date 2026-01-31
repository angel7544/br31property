"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, CheckSquare, Square, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      try {
        // Fetch role to store in session
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        const role = profile?.role || 'tenant';
        
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
           throw new Error("Failed to create session");
        }

        // Force a hard navigation to ensure cookies are applied and middleware runs
        window.location.href = redirect || "/pgs";
      } catch (e: any) {
        console.error(e);
        setError(e.message || "An unexpected error occurred during login.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 relative overflow-hidden">
      
      <div className="z-10 w-full max-w-md px-4">
        <Link href="/login" className="flex items-center text-gray-500 hover:text-orange-500 mb-4 transition-colors">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Phone Login
        </Link>
        
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 text-sm mt-1">Sign in with your email address</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="john@example.com"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                  Remember me
                </label>
                <a href="#" className="text-orange-600 hover:underline font-medium">Forgot Password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-orange-600 font-medium hover:underline">
                Sign Up
              </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
