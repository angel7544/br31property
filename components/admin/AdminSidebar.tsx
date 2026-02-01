"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  BedDouble, 
  CalendarCheck, 
  Users2, 
  Receipt, 
  Settings, 
  LogOut,
  BookOpen,
  MessageSquareQuote,
  Wrench,
  Package,
  AlertTriangle,
  ClipboardList
} from "lucide-react";
import { signOut } from "@/lib/auth";
import { useState } from "react";

interface AdminSidebarProps {
  roles: string[];
  onNavigate?: () => void;
}

export default function AdminSidebar({ roles, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Properties", href: "/admin/properties", icon: Building2 },
    { name: "Rooms & Beds", href: "/admin/rooms", icon: BedDouble },
    { name: "Reservations", href: "/admin/reservations", icon: ClipboardList },
    { name: "Enquiries", href: "/admin/enquiries", icon: CalendarCheck },
    { name: "Invoices", href: "/admin/invoices", icon: Receipt },
    { name: "Maintenance", href: "/admin/maintenance", icon: Wrench },
    { name: "Inventory", href: "/admin/inventory", icon: Package },
    { name: "Complaints", href: "/admin/complaints", icon: AlertTriangle },
    { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
    { name: "Blogs", href: "/admin/blogs", icon: BookOpen },
    { name: "Staff/Users", href: "/admin/staff", icon: Users2 },
    { name: "Offers", href: "/admin/offers", icon: Receipt },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (roles.includes("admin")) return true;
    if (roles.includes("owner")) return true;
    if (roles.includes("staff")) {
      return !["Staff/Users", "Settings", "Properties"].includes(item.name);
    }
    return false;
  });

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
      <nav className="flex flex-col py-2">
        {filteredNavigation.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
            
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition-colors border-l-4 ${
                isActive
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              {item.name}
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
