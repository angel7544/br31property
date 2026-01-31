"use client";
import { useState, useEffect } from "react";
import { Calendar, CheckCircle, XCircle, Clock, Search, Filter, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

type Reservation = {
  id: string;
  user_id: string;
  property_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: "Pending" | "Confirmed" | "Cancelled" | "Checked In" | "Checked Out";
  total_amount: number;
  created_at: string;
  profiles?: { full_name: string; email: string; phone: string };
  properties?: { name: string };
  rooms?: { name: string; type: string };
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const supabase = createClient();

  const fetchReservations = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        profiles(full_name, email, phone),
        properties(name),
        rooms(name, type)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      // addToast("Failed to fetch reservations", "error"); // Suppress if table doesn't exist yet
    } else {
      setReservations(data as any || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchReservations();
    const interval = setInterval(() => fetchReservations(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("reservations")
      .update({ status })
      .eq("id", id);

    if (error) {
      addToast("Failed to update status", "error");
    } else {
      addToast("Status updated", "success");
      fetchReservations(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      case "Checked In": return "bg-blue-100 text-blue-800";
      case "Checked Out": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Reservations
        </h1>
        {/* Add filters or create button here if needed */}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
                <th className="p-4">Guest</th>
                <th className="p-4">Property / Room</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No reservations found</td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{res.profiles?.full_name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{res.profiles?.email}</div>
                      <div className="text-xs text-gray-400">{res.profiles?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{res.properties?.name || "Unknown Property"}</div>
                      <div className="text-xs text-gray-500">{res.rooms?.name} ({res.rooms?.type})</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <span className="text-gray-500">In:</span> {format(new Date(res.check_in_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Out:</span> {format(new Date(res.check_out_date), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      ₹{res.total_amount}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {res.status === "Pending" && (
                          <>
                            <button 
                              onClick={() => updateStatus(res.id, "Confirmed")}
                              className="p-1 hover:bg-green-100 text-green-600 rounded"
                              title="Confirm"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateStatus(res.id, "Cancelled")}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {res.status === "Confirmed" && (
                          <button 
                            onClick={() => updateStatus(res.id, "Checked In")}
                            className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                            title="Check In"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                         {res.status === "Checked In" && (
                          <button 
                            onClick={() => updateStatus(res.id, "Checked Out")}
                            className="p-1 hover:bg-gray-100 text-gray-600 rounded"
                            title="Check Out"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
