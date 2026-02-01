import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
    <div className="min-h-screen bg-blue-50/50 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
            <p className="text-gray-600">Fill in the details below to reach thousands of potential tenants</p>
          </div>
          
          <ListPropertyForm userId={user.id} />
        </div>
      </div>
    </div>
  );
}
