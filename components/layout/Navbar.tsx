"use client";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { getUserRoles } from "@/lib/auth";
import { useSettings } from "@/context/SettingsContext";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<{ name: string; email: string; image?: string; role: string } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const { settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createClient();
    
    // Fetch active offers for marquee
    const fetchOffers = async () => {
        const today = new Date().toISOString();
        const { data } = await supabase
            .from("offers")
            .select("title, discount_value, discount_code")
            .eq("is_active", true)
            .or(`start_date.is.null,start_date.lte.${today}`)
            .or(`end_date.is.null,end_date.gte.${today}`);
        
        if (data) setOffers(data);
    };
    fetchOffers();

    // Subscribe to offers changes for marquee
    const offersChannel = supabase
      .channel('realtime-offers-marquee')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offers',
        },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    const fetchUserData = async (currentUser: User | null) => {
      if (!currentUser) {
        setUserData(null);
        setRoles([]);
        return;
      }

      const r = await getUserRoles();
      setRoles(r);

      // Try to fetch profile details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile) {
        setUserData({
          name: profile.full_name || "",
          email: currentUser.email || "",
          image: profile.avatar_url || undefined,
          role: profile.role
        });
      } else {
        // Fallback to metadata or defaults
        setUserData({
          name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User",
          email: currentUser.email || "",
          image: currentUser.user_metadata?.avatar_url,
          role: r.includes("owner") ? "Owner" : r.includes("admin") ? "Admin" : r.includes("staff") ? "Staff" : "Tenant"
        });
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        fetchUserData(data.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      fetchUserData(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
      supabase.removeChannel(offersChannel);
    };
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
    setRoles([]);
    router.push("/");
    router.refresh();
  };

  return (
    <>
    {/* Offers Marquee */}
    {offers.length > 0 && !pathname?.startsWith("/admin") && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900 text-white overflow-hidden h-8 flex items-center">
            <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-medium tracking-wide">
                {[...offers, ...offers, ...offers, ...offers, ...offers, ...offers, ...offers, ...offers, ...offers, ...offers].map((offer, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="text-blue-400 font-bold">{offer.discount_value}</span>
                        <span>{offer.title}</span>
                        {offer.discount_code && (
                            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/20">
                                Code: {offer.discount_code}
                            </span>
                        )}
                    </span>
                ))}
            </div>
        </div>
    )}

    <nav className={`fixed left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm ${
        offers.length > 0 && !pathname?.startsWith("/admin") ? "top-8" : "top-0"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative h-16 w-32 overflow-hidden rounded-lg">
                <Image
                  src="/logo.png"
                  alt={settings.siteName || "Logo"}
                  fill
                  sizes="(max-width: 768px) 128vw, 128px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex md:items-center md:space-x-8">
            {[
              { label: "Home", href: "/" },
              { label: "PGs / Flats", href: "/pgs" },
              { label: "List Your Property", href: "/list-property" },
              { label: "Blog", href: "/blog" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === link.href 
                    ? "text-blue-600" 
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 group"
                >
                  <div className="relative h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 overflow-hidden group-hover:border-blue-400 transition-colors">
                    {userData?.image ? (
                      <Image 
                        src={userData.image} 
                        alt={userData.name} 
                        fill 
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {userData?.name?.split(' ')[0] || "Profile"}
                    </span>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors pl-4 border-l border-gray-200"
              >
                Login
              </Link>
            )}

            {user && (
              <Link 
                href="/contact" 
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Book Now
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden gap-2">
            {user && (
              <Link 
                href="/contact" 
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-md hover:bg-blue-700 transition-colors"
              >
                Book
              </Link>
            )}
            {user ? (
              <Link 
                href="/profile"
                className="flex items-center gap-2"
              >
                <div className="relative h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 overflow-hidden">
                  {userData?.image ? (
                    <Image 
                      src={userData.image} 
                      alt={userData.name} 
                      fill 
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <UserIcon className="h-4 w-4 text-blue-600" />
                  )}
                </div>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
    </>
  );
}
