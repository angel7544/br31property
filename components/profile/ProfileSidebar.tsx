"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  MessageSquare, 
  Heart, 
  Home, 
  CreditCard, 
  Headphones, 
  PhoneCall, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const menuItems = [
  {
    label: "My Profile",
    icon: User,
    href: "/profile",
    exact: true
  },
  {
    label: "Contacted Owner",
    icon: MessageSquare,
    href: "/profile/contacted-owners"
  },
  {
    label: "Wishlist Properties",
    icon: Heart,
    href: "/profile/wishlist"
  },
  {
    label: "My Listing",
    icon: Home,
    href: "/profile/listings"
  },
  {
    label: "My Subscription",
    icon: CreditCard,
    href: "/profile/subscription"
  },
  {
    label: "Contact Us",
    icon: Headphones,
    href: "/profile/support"
  },
  {
    label: "Request a call Back",
    icon: PhoneCall,
    href: "/profile/callback"
  }
];

export default function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (user) {
          // HARDCODED OVERRIDE for specific emails to ensure access even if DB is lagging
          if (user.email === 'info@br31tech.live' || user.email === 'angel@br31tech.live') {
              setIsAdmin(true);
              // Auto-heal session cookie in background
              fetch("/api/session", { method: "POST" }); 
              return;
          }

          // Check metadata first (faster)
          const metaRoles = (user.app_metadata?.roles as string[]) || [];
          if (metaRoles.includes('admin')) {
              setIsAdmin(true);
              return;
          }

          // Fallback to DB
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile?.role === 'admin') {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error("Error checking role:", error);
      }
    };
    checkRole();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      await fetch("/api/session", { method: "DELETE" }); // Clear server session
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAdminNavigation = async (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Verifying admin credentials...");
    
    try {
      // Force refresh session to ensure cookies are up to date before navigating
      const res = await fetch("/api/session", { method: "POST" });
      
      if (!res.ok) {
        throw new Error("Failed to verify session");
      }

      const data = await res.json();
      
      if (data.role === 'admin') {
         router.push("/admin");
      } else {
         toast.error(`Access Denied: Your role is '${data.role}'. Please contact support.`);
         // Force a reload to try and sync if it's just a glitch
         setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error("Admin navigation error:", error);
      toast.error("Session verification failed. Please try logging in again.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <nav className="flex flex-col py-2">
        {isAdmin && (
          <Link
            href="/admin"
            onClick={handleAdminNavigation}
            className="flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LayoutDashboard className="w-5 h-5 text-gray-400" />
            Admin Dashboard
          </Link>
        )}
        
        {menuItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 ${
                isActive
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {item.label}
            </Link>
          );
        })}
        
        <div className="border-t border-gray-100 my-2 pt-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors border-l-4 border-transparent text-left"
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </nav>
    </div>
  );
}
