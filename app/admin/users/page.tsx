import { createClient } from "@/lib/supabase/server";
import { User, Phone, Mail, Shield, Search, MapPin } from "lucide-react";

export default async function AdminUsersPage() {
  const supabase = createClient();

  // Fetch all profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-8 text-red-500">Error loading users: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Registered Users</h1>
           <p className="text-gray-500">Manage tenants and owners across the platform</p>
        </div>
        <div className="flex gap-4">
           {/* Add export or other actions here */}
           <div className="relative">
              <input 
                 type="text" 
                 placeholder="Search users..." 
                 className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Contact Info</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        user.full_name?.[0]?.toUpperCase() || <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name || "Unknown"}</div>
                      <div className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {user.phone || "N/A"}
                    </div>
                    {(user.city || user.state) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {[user.city, user.state].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize
                    ${user.role === 'owner' ? 'bg-purple-100 text-purple-700' : 
                      user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'}`}>
                    {user.role === 'admin' && <Shield className="w-3 h-3" />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                   </span>
                </td>
              </tr>
            ))}
            {users?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
