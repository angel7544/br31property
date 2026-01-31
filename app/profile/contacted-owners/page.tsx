import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export default async function ContactedOwnersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch enquiries made by this user (by email)
  const { data: enquiries, error } = await supabase
    .from("enquiries")
    .select(`
      *,
      properties (
        id,
        name,
        slug,
        address,
        city,
        images
      )
    `)
    .eq("email", user.email)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching enquiries:", error);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contacted Owners</h1>
      
      <div className="space-y-4">
        {enquiries?.map((enquiry) => (
          <div key={enquiry.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Property Image */}
              <div className="w-full md:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                {enquiry.properties?.images?.[0] ? (
                  <img 
                    src={enquiry.properties.images[0]} 
                    alt={enquiry.properties.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {enquiry.properties?.name || "Unknown Property"}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {enquiry.properties?.address}, {enquiry.properties?.city}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    enquiry.status === 'New' ? 'bg-blue-100 text-blue-700' :
                    enquiry.status === 'Responded' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {enquiry.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    Move-in: <span className="font-medium ml-1">{enquiry.move_in_date}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Sent on: <span className="font-medium">{new Date(enquiry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {enquiry.properties?.slug && (
                  <div className="mt-4 flex justify-end">
                    <Link 
                      href={`/pg/${enquiry.properties.city.toLowerCase()}/${enquiry.properties.slug}`}
                      className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-700"
                    >
                      View Property <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!enquiries || enquiries.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No enquiries found</div>
            <Link href="/pgs" className="text-pink-600 font-medium hover:underline">
              Browse Properties
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
