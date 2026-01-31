"use client";
import { useEffect, useState } from "react";
import { Send, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface InquiryFormProps {
  propertyId?: string;
  roomId?: string;
  propertyName?: string;
  roomName?: string;
}

export default function InquiryForm({ propertyId, roomId, propertyName, roomName }: InquiryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Pre-fill from metadata or profile if available
        setName(user.user_metadata?.full_name || "");
        setPhone(user.user_metadata?.phone || "");
        setEmail(user.email || "");
      }
      setLoadingUser(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // If props are provided, pre-fill message
    if (propertyName) {
      setMessage((prev) => {
        if (prev) return prev;
        return `I am interested in ${roomName ? `${roomName} at ` : ""}${propertyName}. Please provide more details.`;
      });
    }
  }, [propertyName, roomName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id, // Link to user
          name,
          phone,
          email,
          moveInDate,
          message,
          propertyId,
          roomId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setStatus("success");
      // Don't clear name/phone/email as they are user details
      setMoveInDate(""); setMessage("");
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingUser) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        {propertyName ? `Enquire about ${propertyName}` : "Send Inquiry / Book Now"}
      </h3>
      
      {!user ? (
        <div className="text-center py-6">
          <Lock className="w-12 h-12 text-pink-200 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Login to Contact Owner</h4>
          <p className="text-gray-500 mb-6 text-sm">
            To ensure privacy and avoid spam, please sign in to view contact details and send inquiries.
          </p>
          <div className="space-y-3">
             <Link 
               href={`/login?redirect=${encodeURIComponent(pathname)}`}
               className="block w-full bg-pink-600 text-white font-medium py-2.5 rounded-lg hover:bg-pink-700 transition-colors"
             >
               Sign In
             </Link>
             <Link 
               href={`/auth/signup?next=${encodeURIComponent(pathname)}`}
               className="block w-full bg-white border border-pink-600 text-pink-600 font-medium py-2.5 rounded-lg hover:bg-pink-50 transition-colors"
             >
               Create Account
             </Link>
          </div>
        </div>
      ) : (
        <>
          {status === "success" ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
              <p className="font-medium">Inquiry Submitted!</p>
              <p className="text-sm">We have received your request and shared your details with the owner.</p>
              <button onClick={() => setStatus(null)} className="text-sm underline mt-2">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  readOnly // Lock name to profile
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none bg-gray-50 text-gray-500" 
                  value={name} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    required
                    readOnly // Lock phone to profile
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none bg-gray-50 text-gray-500" 
                    value={phone} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email"
                    readOnly // Lock email to profile
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none bg-gray-50 text-gray-500" 
                    value={email} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Move-in Date</label>
                <input 
                  required
                  type="date"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                  value={moveInDate} 
                  onChange={(e) => setMoveInDate(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
                  rows={3}
                  placeholder="I am interested in..."
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                />
              </div>

              <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex gap-2">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Your contact details will be shared with the property owner only when you submit this inquiry.</p>
              </div>

              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full bg-pink-600 text-white font-medium py-3 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Sending..." : <>Send Inquiry <Send className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
