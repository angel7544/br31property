"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ConciergeBell, Package, Phone, MoreHorizontal, X, MapPin, Mail, Facebook, Instagram, LogIn, LayoutDashboard, BedDoubleIcon, XIcon, ExternalLink, ChevronRight, AlignVerticalSpaceAround, NotebookIcon, NewspaperIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { PiArticleBold } from "react-icons/pi";
import { article } from "framer-motion/m";
import { CgNotes } from "react-icons/cg";
import { TbNewSection } from "react-icons/tb";
import { FaNewspaper } from "react-icons/fa";

export default function MobileTabBar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/pgs", label: "PGs", icon: BedDoubleIcon },
    { href: "/list-property", label: "List PG", icon: ConciergeBell },
    { href: "/blog", label: "Blogs", icon: NewspaperIcon},
    { href: "#more", label: "More", icon: MoreHorizontal },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "#more") return isMoreOpen;
    return pathname.startsWith(href);
  };

  const onItemClick = (href: string) => {
    if (href === "#more") {
      setIsMoreOpen(true);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsMoreOpen(false);
    router.push("/");
    router.refresh();
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <ul className="grid grid-cols-5 h-16">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex justify-center items-center">
              {href === "#more" ? (
                <button
                  onClick={() => onItemClick(href)}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                    isActive(href) ? "text-blue-600 scale-110" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive(href) ? "stroke-[2.5px]" : "stroke-2"}`} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ) : (
                <Link
                  href={href}
                  className={`w-full h-full flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                    isActive(href) ? "text-blue-600 scale-110" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive(href) ? "stroke-[2.5px]" : "stroke-2"}`} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop - z-30 to sit behind navbar (z-40) but above content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 sm:hidden"
            />
            
            {/* Slide-up Panel - Positioned above navbar */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[calc(4rem+12px)] left-3 right-3 bg-white rounded-2xl z-50 sm:hidden overflow-hidden shadow-2xl shadow-black/20 border border-gray-100"
              style={{ maxHeight: 'calc(100vh - 6rem)' }}
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsMoreOpen(false)}>
                <div className="w-6 h-1.5 bg-gray-200 rounded-full" />
              </div>

              <div className="p-4 pt-1 space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                {/* Header with Close */}
                <div className="flex justify-between items-center">
                  {/* <h2 className="text-xl font-bold text-gray-900">Menu</h2> */}
                  {/* <button 
                    onClick={() => setIsMoreOpen(false)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button> */}
                </div>

                {/* User Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 shadow-sm p-1">
                  {user ? (
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {user.email?.[0].toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-0.5">Signed in as</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href="/admin"
                          onClick={() => setIsMoreOpen(false)}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
                        <LogIn className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Staff Access</h3>
                      <p className="text-sm text-gray-500 mb-4">Manage reservations and services</p>
                      <Link
                        href="/login"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-blue-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-[0.98]"
                      >
                        Login to Dashboard
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Actions Grid */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-1">Connect With Us</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <a href="tel:+919708403070" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-semibold">Call Now</span>
                    </a>
                    {user && (
                      <Link href="/contact" onClick={() => setIsMoreOpen(false)} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-semibold">Enquire Now</span>
                      </Link>
                    )}
                    <a href="https://maps.google.com/?q=hotel+sakura+ganagtok" target="_blank" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-100">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-semibold">Locate</span>
                    </a>
                    <a href="mailto:support@br31tech.live" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-100">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-sm font-semibold">Email</span>
                    </a>
                  </div>
                </div>

                {/* Footer / Socials */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-center gap-6 mb-6">
                    {[
                      { icon: Facebook, href: "https://facebook.com/br31technologies", color: "text-blue-600 bg-blue-50" },
                      { icon: Instagram, href: "https://instagram.com/br31tech.live", color: "text-blue-600 bg-blue-50" },
                      { icon: XIcon, href: "https://x.com/angelmehul", color: "text-gray-800 bg-gray-100" },
                    ].map((social, i) => (
                      <a 
                        key={i}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-3 rounded-full transition-transform hover:scale-110 ${social.color}`}
                      >
                        <social.icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                    <img
                      src="https://br31tech.live/logo.png"
                      alt="BR31 Tech Logo"
                      className="h-8 w-auto object-contain"
                    />
                    <span className="text-[10px] text-gray-500 font-medium tracking-wide">
                      Powered by BR31 Technologies
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
