"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FilePen,
  TrendingUp,
  Settings2,
  LogOut,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  profile: {
    name: string | null;
    email: string | null;
    business_name: string | null;
    plan: string;
  };
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/invoices", icon: FileText, label: "Invoices" },
    { href: "/contracts", icon: FilePen, label: "Contracts" },
    { href: "/earnings", icon: TrendingUp, label: "Earnings" },
    { href: "/settings", icon: Settings2, label: "Settings" },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Get initials
  const getInitials = () => {
    if (profile?.name) {
      return profile?.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-[240px] bg-[#111111] border-r border-[#27272a] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/dashboard" className="text-xl font-bold text-[#10b981]">
          Paidly
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "text-[#10b981] bg-[#10b981]/10"
                  : "text-[#a1a1aa] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[#27272a]">
        {/* Upgrade Prompt (Free users only) */}
        {profile?.plan === "free" && (
          <div className="mb-3 p-3 border border-[#10b981]/30 rounded-lg bg-[#10b981]/5">
            <div className="flex items-start gap-2 mb-2">
              <Zap size={16} className="text-[#10b981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-bold text-white">
                  Upgrade to Pro
                </p>
                <p className="text-[12px] text-[#a1a1aa]">
                  Keep 100% of your payments
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/pricing"
              className="w-full py-2 bg-[#10b981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-1"
            >
              Upgrade →
            </Link>
          </div>
        )}

        {/* Plan Badge */}
        <div className="mb-3">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
              profile?.plan === "pro"
                ? "bg-[#10b981]/20 text-[#10b981]"
                : "bg-[#27272a] text-[#a1a1aa]"
            }`}
          >
            {profile?.plan === "pro" ? "Pro" : "Free"}
          </span>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#10b981]/20 text-[#10b981] flex items-center justify-center text-sm font-medium flex-shrink-0">
            {getInitials()}
          </div>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.name || "User"}
            </p>
            <p className="text-xs text-[#a1a1aa] truncate">{profile?.email}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#a1a1aa] hover:text-[#ef4444] transition-colors disabled:opacity-50"
        >
          <LogOut size={18} />
          <span>{loggingOut ? "Logging out..." : "Log out"}</span>
        </button>
      </div>
    </aside>
  );
}
