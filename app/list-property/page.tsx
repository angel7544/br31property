import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import ListPropertyForm from "@/components/ListPropertyForm";

export const metadata = {
  title: "List Your Property | PG Dekho",
  description: "Rent your PG or Flats with us. Join our growing network of property owners.",
};

export default async function ListPropertyPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/list-property");
  }

  return (
    <div className="min-h-screen bg-blue-50/50 pt-32 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm overflow-hidden p-8 md:p-12">
          
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            
            {/* Form Section */}
            <div className="w-full lg:w-1/2">
              <h1 className="text-2xl font-bold text-gray-900 mb-8">Rent Your PG or Flats with us</h1>
              <ListPropertyForm userId={user.id} />
            </div>

            {/* Image Section */}
            <div className="w-full lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md aspect-square bg-gradient-to-tr from-orange-100 to-blue-50 rounded-full overflow-hidden p-8">
                 {/* Abstract Background Shapes */}
                 <div className="absolute top-0 right-0 w-full h-full bg-[url('https://img.freepik.com/free-vector/gradient-white-monochrome-background_23-2149017006.jpg')] opacity-20 mix-blend-overlay"></div>
                 
                 <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Image 
                      src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80" 
                      alt="List Property" 
                      fill
                      className="object-cover"
                    />
                 </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
