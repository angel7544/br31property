import { createClient } from "@/lib/supabase/server";
import { Mail, Phone, Calendar, MessageSquare, Home } from "lucide-react";

export default async function OwnerEnquiriesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please log in</div>;

  // Fetch enquiries for properties owned by this user
  const { data: enquiries, error } = await supabase
    .from("enquiries")
    .select(`
      *,
      properties (
        name,
        owner_id
      )
    `)
    .eq("properties.owner_id", user.id) // Filter by owner
    .order("created_at", { ascending: false });

  // Note: Supabase complex filtering on joined tables can be tricky.
  // If the above query doesn't filter correctly on the server side (due to RLS or query structure),
  // we might need to fetch properties first then enquiries, or use a view.
  // However, let's try to filter in memory if the volume is low for MVP, 
  // OR strictly, we should ensure RLS policies allow owners to see enquiries for their properties.
  
  // Refined approach:
  // 1. Get Property IDs owned by user
  const { data: myProperties } = await supabase
     .from("properties")
     .select("id")
     .eq("owner_id", user.id);
  
  const propertyIds = myProperties?.map(p => p.id) || [];

  let finalEnquiries: any[] = [];
  
  if (propertyIds.length > 0) {
      const { data: directEnquiries } = await supabase
        .from("enquiries")
        .select(`
            *,
            properties (name)
        `)
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false });
        
      finalEnquiries = directEnquiries || [];
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Enquiries</h1>
      <p className="text-gray-500 mb-8">Messages from interested tenants</p>

      <div className="space-y-4">
        {finalEnquiries.map((enquiry) => (
          <div key={enquiry.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              
              {/* Left: User Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                   <h3 className="font-bold text-lg text-gray-900">{enquiry.name}</h3>
                   <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Potential Tenant</span>
                </div>
                
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {enquiry.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {enquiry.email}
                  </div>
                </div>
              </div>

              {/* Middle: Property & Interest */}
              <div className="flex-1 border-l border-gray-100 pl-0 md:pl-6">
                 <div className="flex items-center gap-2 mb-2 text-gray-900 font-medium">
                    <Home className="w-4 h-4 text-orange-500" />
                    {enquiry.properties?.name}
                 </div>
                 <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Move-in: <span className="text-gray-900 font-medium">{enquiry.move_in_date || "Not specified"}</span>
                 </div>
                 <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 italic">
                    <MessageSquare className="w-3 h-3 inline-block mr-1 text-gray-400" />
                    "{enquiry.message}"
                 </div>
              </div>

              {/* Right: Actions/Status */}
              <div className="flex flex-col justify-between items-end min-w-[120px]">
                 <span className="text-xs text-gray-400">
                    {new Date(enquiry.created_at).toLocaleDateString()}
                 </span>
                 <button className="bg-pink-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors">
                    Contact Now
                 </button>
              </div>

            </div>
          </div>
        ))}

        {finalEnquiries.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
             <div className="text-gray-400 mb-2">No enquiries yet</div>
             <p className="text-sm text-gray-500">When users contact you, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
