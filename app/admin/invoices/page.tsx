"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Plus, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Invoice = {
  id: string;
  guest_name?: string; // Fallback if no relation
  user_id?: string;
  profiles?: { full_name: string; email: string };
  amount: number;
  status: string;
  due_date: string;
  description: string;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: "",
    guest_name: "",
    amount: 0,
    status: "Pending",
    due_date: new Date().toISOString().split('T')[0],
    description: ""
  });
  const supabase = createClient();

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    // Try to fetch with profiles relation
    const { data, error } = await supabase
        .from("invoices")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      // Fallback or empty
      setInvoices([]); 
    } else {
      setInvoices(data || []);
    }
    if (!silent) setLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });
    
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchUsers();
    const interval = setInterval(() => {
      fetchInvoices(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("invoices").insert([
      {
        user_id: formData.user_id || null,
        // guest_name: formData.guest_name, // Removed in new schema, should link to user_id ideally, but for now we might store description
        amount: formData.amount,
        status: formData.status,
        due_date: formData.due_date,
        description: formData.description
      }
    ]);

    if (error) {
      console.error(error);
      toast.error("Failed to create invoice");
    } else {
      toast.success("Invoice created successfully");
      setShowCreateModal(false);
      setFormData({
        user_id: "",
        guest_name: "",
        amount: 0,
        status: "Pending",
        due_date: new Date().toISOString().split('T')[0],
        description: ""
      });
      fetchInvoices();
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(219, 39, 119); // blue-600
    doc.text("Hotel Sakura", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", 105, 30, { align: "center" });

    // Invoice Details
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice.id}`, 20, 50);
    doc.text(`Date: ${invoice.due_date}`, 20, 58);
    doc.text(`Guest: ${invoice.profiles?.full_name || invoice.guest_name || "Guest"}`, 20, 66);
    doc.text(`Status: ${invoice.status}`, 150, 50);

    // Line
    doc.setLineWidth(0.5);
    doc.line(20, 75, 190, 75);

    // Items
    doc.text("Description", 20, 85);
    doc.text("Amount", 160, 85);
    
    doc.text(invoice.description || "Room Charges", 20, 95);

    // Total
    doc.line(20, 105, 190, 105);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ₹${invoice.amount}`, 160, 115);

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for staying with Hotel Sakura!", 105, 280, { align: "center" });

    doc.save(`Invoice-${invoice.id}.pdf`);
    toast.success("Invoice PDF downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Create Invoice
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No invoices found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.profiles?.full_name || inv.guest_name || "Unknown"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">₹{inv.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => generatePDF(inv)} className="text-gray-600 hover:text-gray-900" title="Download PDF">
                      <Download className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowCreateModal(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Create Invoice</h3>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">Guest / User</label>
                    <select
                      id="user_id"
                      value={formData.guest_name}
                      onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a Guest</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      id="date"
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="items" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="items"
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Room Charges, Food, etc."
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Create Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
