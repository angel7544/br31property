import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ListPropertyForm from "@/components/ListPropertyForm";
import { getUserRoles } from "@/lib/auth";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const propertyId = params.id;

  // Fetch property details
  const { data: property, error } = await supabase
    .from("properties")
    .select("*, rooms(*)")
    .eq("id", propertyId)
    .single();

  if (error || !property) {
    notFound();
  }

  // Check ownership or admin status
  const roles = await getUserRoles(supabase, user);
  const isOwner = property.owner_id === user.id;
  const isAdmin = roles.includes("admin");

  if (!isOwner && !isAdmin) {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to edit this property.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
        <p className="mt-2 text-gray-600">Update your property details below.</p>
      </div>
      
      <ListPropertyForm 
        userId={user.id} 
        initialData={property} 
        isEditMode={true} 
      />
    </div>
  );
}
