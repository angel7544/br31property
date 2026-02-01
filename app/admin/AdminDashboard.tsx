"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DollarSign, Users, Calendar, Bed, Building, BadgeIndianRupee, IndianRupee, ShieldAlert } from "lucide-react";
import SupportSection from "@/components/admin/SupportSection";

interface AdminDashboardProps {
  roles: string[];
  userEmail: string;
}

export default function AdminDashboard({ roles, userEmail }: AdminDashboardProps) {
  const [stats, setStats] = useState<{
    name: string;
    value: string;
    icon: any;
    color: string;
  }[]>([
    // { name: "Total Revenue", value: "-", icon: DollarSign, color: "bg-green-500" },
    { name: "Active Bookings", value: "-", icon: Calendar, color: "bg-blue-500" },
    { name: "Room Occupancy", value: "-", icon: Bed, color: "bg-indigo-500" },
    { name: "New Customers", value: "-", icon: Users, color: "bg-blue-500" },
  ]);

  const [recent, setRecent] = useState<any[]>([]);
  
  // Allow explicit override for known admin emails
  const isHardcodedAdmin = userEmail === 'info@br31tech.live' || userEmail === 'angel@br31tech.live';
  const allowed = roles ? (roles.includes("owner") || roles.includes("staff") || roles.includes("admin") || isHardcodedAdmin) : isHardcodedAdmin;

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      // Total Revenue from invoices (Disabled)
      // const { data: invoices } = await supabase
      //   .from("invoices")
      //   .select("amount,status")
      //   .eq("status", "Paid");
      // const totalRevenue = (invoices || []).reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0);

      // Active Bookings from reservations with status Confirmed
      const { count: activeBookings } = await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("status", "Confirmed");

      // Occupancy: rooms Occupied vs total
      const { count: totalRooms } = await supabase
        .from("rooms")
        .select("id", { count: "exact", head: true });
      const { count: occupiedRooms } = await supabase
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .eq("status", "Occupied");
      const occupancy = totalRooms && totalRooms > 0 ? Math.round(((occupiedRooms || 0) / totalRooms) * 100) : 0;

      // New Customers: distinct customer_email in last 30 days
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: recentRes } = await supabase
        .from("reservations")
        .select("customer_email, customer_name, created_at")
        .gte("created_at", since.toISOString());
      const distinctEmails = new Set((recentRes || []).map((r: any) => r.customer_email || r.customer_name));

      setStats([
        // { name: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}`, icon: IndianRupee, color: "bg-green-500" },
        { name: "Active Bookings", value: String(activeBookings ?? 0), icon: Calendar, color: "bg-blue-500" },
        { name: "Room Occupancy", value: `${occupancy}%`, icon: Bed, color: "bg-indigo-500" },
        { name: "New Customers", value: String(distinctEmails.size), icon: Users, color: "bg-blue-500" },
      ]);

      // Recent Reservations list
      const { data: reservations } = await supabase
        .from("reservations")
        .select("id, customer_name, status, check_in, check_out, rooms(name), properties(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent(reservations || []);
    };

    let channel: any;

    if (allowed) {
      loadData();
      const supabase = createClient();
      channel = supabase.channel('realtime-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, loadData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, loadData)
        .subscribe();
    }

    return () => {
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [allowed]);

  if (!allowed) return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-red-50 p-6 flex justify-center border-b border-red-100">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
        </div>
        
        <div className="p-8 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
            <p className="mt-2 text-gray-600">
              You do not have the required permissions to access this dashboard.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Session Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200/50">
                <span className="text-gray-500">Account</span>
                <span className="font-medium text-gray-900 truncate max-w-[180px]" title={userEmail}>{userEmail || "No email"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Your Roles</span>
                <span className="font-medium text-gray-900">
                  {roles && roles.length > 0 ? roles.join(", ") : "None"}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="font-medium text-gray-700">Required Role:</span> 
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium">admin</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium">owner</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium">staff</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/login" 
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Log in with Different Account
            </Link>
            <Link 
              href="/" 
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-lg bg-white shadow hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-md ${item.color} text-white`}>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="rounded-lg bg-white shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Reservations</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {recent.map((r) => (
              <li key={r.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.customer_name}</p>
                    <p className="text-sm text-gray-500 truncate">{r.properties?.name || "Unknown Property"} • Room {r.rooms?.name || "?"}</p>
                    <p className="text-xs text-gray-400">{new Date(r.check_in).toLocaleDateString()} - {new Date(r.check_out).toLocaleDateString()}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.status === "Confirmed" ? "bg-green-100 text-green-800" :
                    r.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                    r.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="px-6 py-6 text-center text-sm text-gray-500">No recent reservations</li>
            )}
          </ul>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link href="/admin/reservations" className="text-sm font-medium text-blue-600 hover:text-blue-500">View all reservations &rarr;</Link>
          </div>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link href="/admin/reservations" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Calendar className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">New Reservation</span>
            </Link>
            <Link href="/admin/properties" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Building className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Property</span>
            </Link>
             <Link href="/admin/rooms" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Bed className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Manage Rooms</span>
            </Link>
             <Link href="/admin/staff" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Users className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-900">Add Staff</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-8">
        <SupportSection userEmail={userEmail} />
      </div>
    </div>
  );
}