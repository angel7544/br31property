"use client";
import { 
  LayoutDashboard, 
  Building2, 
  BedDouble, 
  CalendarCheck, 
  Users2, 
  Receipt, 
  Settings, 
  LogOut,
  Package,
  ConciergeBell,
  MessageSquareQuote,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut, getUserRoles } from "@/lib/auth";
import { Dock, DockIcon } from "@/components/ui/dock";
import { useSettings } from "@/context/SettingsContext";
import Image from "next/image";

import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [user, setUser] = useState<{ name: string; email: string; image?: string; role: string } | null>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const init = async () => {
      const r = await getUserRoles();
      setRoles(r);

      const supabase = getSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Try to fetch staff details
        const { data: staff } = await supabase
          .from("staff")
          .select("name, image_url, role")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (staff) {
          setUser({
            name: staff.name,
            email: authUser.email || "",
            image: staff.image_url,
            role: staff.role
          });
        } else {
          // Fallback to metadata or defaults
          setUser({
            name: authUser.user_metadata?.name || "Admin User",
            email: authUser.email || "",
            image: authUser.user_metadata?.avatar_url,
            role: r.includes("admin") ? "Admin" : (r.includes("owner") ? "Owner" : "Staff")
          });
        }
      }
    };
    init();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Properties", href: "/admin/properties", icon: Building2 },
    { name: "Rooms & Beds", href: "/admin/rooms", icon: BedDouble },
    { name: "Enquiries", href: "/admin/enquiries", icon: CalendarCheck },
    { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
    { name: "Blogs", href: "/admin/blogs", icon: BookOpen },
    { name: "Staff/Users", href: "/admin/staff", icon: Users2 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Offers", href: "/admin/offers", icon: Receipt },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (roles.includes("admin")) return true;
    if (roles.includes("owner")) return true;
    if (roles.includes("staff")) {
      return !["Staff/Users", "Settings", "Properties"].includes(item.name);
    }
    return false;
  });

  // Protect routes
  useEffect(() => {
    if (roles.length > 0 && !roles.includes("admin") && !roles.includes("owner") && roles.includes("staff")) {
        const restricted = ["/admin/staff", "/admin/settings", "/admin/properties"];
        if (restricted.some(r => pathname.startsWith(r))) {
            router.push("/admin");
        }
    }
  }, [pathname, roles, router]);

  // Get current page title
  const currentPage = navigation.find(item => item.href === pathname)?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Desktop Header */}
      <div className="hidden md:flex sticky top-0 z-40 w-full items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-4">
        <Link href="/" className="flex items-center gap-3">
            {settings.logoUrl ? (
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  fill
                  className="object-contain"
                />
              </div>
            ) : null}
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {settings.siteName || "BR31 PROERTYMANAGEMENT SYSTEM"}
            </span>
        </Link>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-semibold text-gray-900">{user?.name || (roles.includes('admin') ? 'Admin' : (roles.includes('owner') ? 'Owner' : 'Staff'))}</p>
                 <p className="text-xs text-gray-500 capitalize">{user?.role || roles.join(', ')}</p>
               </div>
               <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold overflow-hidden relative border border-pink-200">
                 {user?.image ? (
                   <Image src={user.image} alt={user.name} fill className="object-cover" />
                 ) : (
                   <span>{user?.name?.charAt(0).toUpperCase() || (roles.includes('admin') ? 'A' : (roles.includes('owner') ? 'O' : 'S'))}</span>
                 )}
               </div>
             </div>
        </div>
      </div>

      {/* Dock Navigation (Visible on both Mobile and Desktop) */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Dock className="bg-white/80 dark:bg-black/80 border border-gray-200 shadow-xl">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <DockIcon key={item.name} className={isActive ? "bg-pink-100" : ""}>
                  <Link href={item.href} className="w-full h-full flex items-center justify-center">
                    <item.icon className={`h-5 w-5 ${isActive ? "text-pink-600" : "text-gray-600"}`} />
                  </Link>
                </DockIcon>
              );
            })}
            <div className="w-px h-8 bg-gray-200 mx-1 self-center" />
            <DockIcon>
              <button 
                onClick={async () => { await signOut(); router.push("/"); }}
                className="w-full h-full flex items-center justify-center text-red-500 hover:text-red-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </DockIcon>
          </Dock>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        {/* Mobile Header */}
        <div className="sticky top-0 z-20 md:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link href="/" className="relative h-8 w-8 flex-shrink-0">
                {settings.logoUrl ? (
                    <Image
                      src={settings.logoUrl}
                      alt={settings.siteName}
                      fill
                      className="object-contain"
                    />
                ) : (
                    <div className="h-full w-full bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 font-bold">
                        {settings.siteName?.charAt(0) || "S"}
                    </div>
                )}
            </Link>
            <span className="font-bold text-gray-900 text-lg">{currentPage}</span>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="text-right">
                <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name?.split(' ')[0] || (roles.includes('admin') ? 'Admin' : "User")}</p>
                <p className="text-[10px] text-gray-500 capitalize leading-none mt-0.5">{user?.role || roles[0] || "Staff"}</p>
             </div>
             <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold overflow-hidden relative border border-pink-200">
               {user?.image ? (
                 <Image src={user.image} alt={user.name} fill className="object-cover" />
               ) : (
                 <span className="text-sm">{user?.name?.charAt(0).toUpperCase() || (roles.includes('admin') ? 'A' : (roles.includes('owner') ? 'O' : 'S'))}</span>
               )}
             </div>
          </div>
        </div>
        
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-32 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
