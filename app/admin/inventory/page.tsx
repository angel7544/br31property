"use client";
import { useState, useEffect } from "react";
import { Package, Plus, AlertTriangle, Search, Filter, Trash2, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";

type InventoryItem = {
  id: string;
  property_id: string;
  item_name: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  last_restocked: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  properties?: { name: string };
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    quantity: 0,
    min_quantity: 5,
    unit_price: 0,
    property_id: "",
  });

  const { addToast } = useToast();
  const supabase = createClient();

  const fetchItems = async (silent = false) => {
    if (!silent) setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*, properties(name)")
      .order("item_name");

    if (error) {
      console.error(error);
    } else {
      setItems(data as any || []);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const status = formData.quantity === 0 ? "Out of Stock" : formData.quantity <= formData.min_quantity ? "Low Stock" : "In Stock";
    
    // For now we default to first property if not selected or handle property selection logic
    // Ideally we fetch properties list. For brevity assuming backend defaults or we add property selector later.
    // We'll skip property_id if empty and let backend handle or require it.
    
    const payload: any = {
      item_name: formData.item_name,
      quantity: formData.quantity,
      min_quantity: formData.min_quantity,
      unit_price: formData.unit_price,
      status,
      last_restocked: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from("inventory").insert([payload]);

    if (error) {
      addToast("Failed to add item", "error");
    } else {
      addToast("Item added successfully", "success");
      setShowModal(false);
      fetchItems();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Out of Stock": return "bg-red-100 text-red-800";
      case "Low Stock": return "bg-yellow-100 text-yellow-800";
      case "In Stock": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6" />
          Inventory
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-medium">
              <th className="p-4">Item Name</th>
              <th className="p-4">Property</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last Restocked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && items.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No inventory items found</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{item.item_name}</td>
                  <td className="p-4 text-gray-600">{item.properties?.name || "-"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {item.quantity}
                      {item.quantity <= item.min_quantity && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="p-4">₹{item.unit_price}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {item.last_restocked ? format(new Date(item.last_restocked), 'MMM dd, yyyy') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg p-2"
                  value={formData.item_name}
                  onChange={e => setFormData({...formData, item_name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full border rounded-lg p-2"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min Quantity</label>
                  <input
                    type="number"
                    required
                    className="w-full border rounded-lg p-2"
                    value={formData.min_quantity}
                    onChange={e => setFormData({...formData, min_quantity: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  required
                  className="w-full border rounded-lg p-2"
                  value={formData.unit_price}
                  onChange={e => setFormData({...formData, unit_price: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
