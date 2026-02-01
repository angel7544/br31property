"use client";
import { 
  LayoutDashboard, 
  Building2, 
  BedDouble, 
  CalendarCheck, 
  Users2, 
  Receipt, 
  Settings, 
  MessageSquareQuote,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserRoles } from "@/lib/auth";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const r = await getUserRoles(createClient());
      setRoles(r);
    };
    init();
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Properties", href: "/admin/properties", icon: Building2 },
    { name: "Rooms & Beds", href: "/admin/rooms", icon: BedDouble },
    { name: "Reservations", href: "/admin/reservations", icon: CalendarCheck },
    { name: "Enquiries", href: "/admin/enquiries", icon: CalendarCheck },
    { name: "Invoices", href: "/admin/invoices", icon: Receipt },
    { name: "Maintenance", href: "/admin/maintenance", icon: Settings }, // Using Settings icon temporarily or import Wrench
    { name: "Inventory", href: "/admin/inventory", icon: Settings }, // Using Settings icon temporarily or import Package
    { name: "Complaints", href: "/admin/complaints", icon: MessageSquareQuote },
    { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
    { name: "Blogs", href: "/admin/blogs", icon: BookOpen },
    { name: "Staff/Users", href: "/admin/staff", icon: Users2 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Offers", href: "/admin/offers", icon: Receipt },
  ];

  // Protect routes
  useEffect(() => {
    if (roles.length > 0 && !roles.includes("admin") && !roles.includes("owner") && roles.includes("staff")) {
        const restricted = ["/admin/staff", "/admin/settings", "/admin/properties"];
        if (restricted.some(r => pathname.startsWith(r))) {
            router.push("/admin");
        }
    }
  }, [pathname, roles, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50"
          >
            <Menu className="w-5 h-5" />
            <span className="font-medium">Admin Menu</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 relative">
          {/* Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside 
            className={`
              fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 md:shadow-none md:bg-transparent
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <div className="h-full flex flex-col md:block">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 md:hidden">
                <span className="font-bold text-lg">Admin Menu</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <AdminSidebar roles={roles} onNavigate={() => setIsSidebarOpen(false)} />
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
