"use client";
import { useState, useEffect } from "react";
import { FileText, Download, Plus, Eye, X } from "lucide-react";
import jsPDF from "jspdf";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/Toast";

type Invoice = {
  id: string;
  guest_name: string;
  amount: number;
  status: string;
  date: string;
  items: string[];
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: "",
    amount: 0,
    status: "Pending",
    date: new Date().toISOString().split('T')[0],
    items: ""
  });
  const { addToast } = useToast();
  const supabase = getSupabaseClient();

  const fetchInvoices = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      // Fallback mock data
      setInvoices([
        { id: "INV-001", guest_name: "John Doe", amount: 450, status: "Paid", date: "2024-12-20", items: ["Room 101 (3 Nights)", "Spa Service"] },
        { id: "INV-002", guest_name: "Jane Smith", amount: 200, status: "Pending", date: "2024-12-22", items: ["Room 201 (1 Night)", "Dinner"] },
        { id: "INV-003", guest_name: "Mike Ross", amount: 1200, status: "Paid", date: "2024-12-25", items: ["Suite 301 (5 Nights)", "All Inclusive"] },
      ]);
    } else {
      setInvoices(data || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(() => {
      fetchInvoices(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsArray = formData.items.split('\n').filter(i => i.trim() !== "");
    
    const { error } = await supabase.from("invoices").insert([
      {
        guest_name: formData.guest_name,
        amount: formData.amount,
        status: formData.status,
        date: formData.date,
        items: itemsArray
      }
    ]);

    if (error) {
      console.error(error);
      addToast("Failed to create invoice", "error");
    } else {
      addToast("Invoice created successfully", "success");
      setShowCreateModal(false);
      setFormData({
        guest_name: "",
        amount: 0,
        status: "Pending",
        date: new Date().toISOString().split('T')[0],
        items: ""
      });
      fetchInvoices();
    }
  };

  const generatePDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(219, 39, 119); // Pink-600
    doc.text("Hotel Sakura", 105, 20, { align: "center" });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE", 105, 30, { align: "center" });

    // Invoice Details
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${invoice.id}`, 20, 50);
    doc.text(`Date: ${invoice.date}`, 20, 58);
    doc.text(`Guest: ${invoice.guest_name}`, 20, 66);
    doc.text(`Status: ${invoice.status}`, 150, 50);

    // Line
    doc.setLineWidth(0.5);
    doc.line(20, 75, 190, 75);

    // Items
    doc.text("Description", 20, 85);
    doc.text("Amount", 160, 85);
    
    let y = 95;
    invoice.items.forEach((item) => {
      doc.text(item, 20, y);
      y += 10;
    });

    // Total
    doc.line(20, y + 5, 190, y + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${invoice.amount}`, 160, y + 15);

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Thank you for staying with Hotel Sakura!", 105, 280, { align: "center" });

    doc.save(`Invoice-${invoice.id}.pdf`);
    addToast("Invoice PDF downloaded", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700"
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.guest_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${inv.amount}</td>
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
                    <label htmlFor="guest_name" className="block text-sm font-medium text-gray-700">Guest Name</label>
                    <input
                      id="guest_name"
                      type="text"
                      required
                      value={formData.guest_name}
                      onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
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
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
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
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="items" className="block text-sm font-medium text-gray-700">Items (One per line)</label>
                    <textarea
                      id="items"
                      rows={4}
                      value={formData.items}
                      onChange={(e) => setFormData({...formData, items: e.target.value})}
                      placeholder="Room 101 - ₹100&#10;Breakfast - ₹20"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    />
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:text-sm"
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
