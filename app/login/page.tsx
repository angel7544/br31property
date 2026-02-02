"use client";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Search, Heart, Star, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";

function LoginPageContent() {
  const [role, setRole] = useState<"user" | "agent">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Fetch role to store in session
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
      const userRole = profile?.role || 'tenant';
      
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: userRole }), // Body is ignored by API but kept for consistency
      });

      if (!response.ok) {
         throw new Error("Failed to create session");
      }
      
      // Get the actual role returned/confirmed by the server
      const sessionData = await response.json();
      const confirmedRole = sessionData.role || userRole;

      toast.success("Login Successful!");
      
      // Determine redirect path
      let targetPath = redirect;
      
      // Fix for malformed redirect URLs (e.g., %Fadmin reported by user on mobile)
      if (targetPath && (targetPath.includes("%F") || targetPath.includes("%25F"))) {
         if (targetPath.toLowerCase().includes("admin")) {
            targetPath = "/admin";
         } else {
            // Fallback: try to replace %F with /
            targetPath = targetPath.replace(/%F/gi, "/").replace(/%25F/gi, "/");
            if (!targetPath.startsWith("/")) targetPath = "/" + targetPath;
         }
      }

      if (!targetPath) {
        if (confirmedRole === 'admin') {
          targetPath = "/profile";
        } else if (confirmedRole === 'owner' || confirmedRole === 'staff') {
          targetPath = "/profile";
        } else {
          targetPath = "/pgs";
        }
      }
      
      // Force a hard navigation to ensure cookies are applied and middleware runs
      window.location.href = targetPath;
      
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className=" flex items-center justify-center bg-gray-50 p-2 pt-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row min-h-[400px]"
      >
        
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Welcome Back</h2>
            
            <div className="bg-gray-50 p-1 rounded-lg flex mb-8 shadow-inner">
            <button
              onClick={() => setRole("user")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === "user" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tenant / Owner
            </button>
            <button
              onClick={() => setRole("agent")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                role === "agent" 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Agent / Staff
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Remember me
              </label>
              <Link href="#" className="text-indigo-600 hover:underline font-medium">Forgot Password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 active:transform active:scale-[0.98]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
            
            <div className="text-center">
               <span className="text-xs text-gray-500">
                  Don't have an account? <Link href="/auth/signup" className="text-indigo-600 font-medium hover:underline">Sign up</Link>
               </span>
            </div>
          </form>
          </motion.div>
        </div>

        {/* Right Side - Benefits */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-slate-900 text-white flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-2xl font-bold mb-8 leading-tight">
              What You Can Do with Your Account
            </h3>

            <ul className="space-y-6">
            <li className="flex items-start gap-4">
              <div className="mt-1 bg-white/10 p-2 rounded-full">
                 <Search className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Advanced Search Filters</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Easily find PGs by location, budget, amenities, and more using smart filters.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="mt-1 bg-white/10 p-2 rounded-full">
                 <Heart className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Saved Favorites</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Bookmark your preferred PG options to compare and access them anytime.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="mt-1 bg-white/10 p-2 rounded-full">
                 <Star className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Trusted Reviews & Ratings</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Read genuine reviews and ratings from tenants to make confident decisions.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="mt-1 bg-white/10 p-2 rounded-full">
                 <User className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">Direct Owner Contact</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Connect directly with PG owners to get accurate details and faster responses.
                </p>
              </div>
            </li>
          </ul>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
