"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Film, Tag, Users, Receipt, Key, LogOut, Clapperboard, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clsx } from "clsx";

const NAV = [
    { href: "/",           icon: LayoutDashboard, label: "Dashboard"  },
    { href: "/movies",     icon: Film,            label: "Movies"     },
    { href: "/categories", icon: Tag,             label: "Categories" },
    { href: "/reviews",    icon: Star,            label: "Reviews"    },  // ← ADD THIS
    { href: "/users",      icon: Users,           label: "Users"      },
    { href: "/purchases",  icon: Receipt,         label: "Purchases"  },
    { href: "/licenses",   icon: Key,             label: "Licenses"   },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#0A0A0F] border-r border-[#1E1E2E] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1E1E2E]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#E50914] rounded flex items-center justify-center flex-shrink-0">
            <Clapperboard size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">A2S Cinemas</p>
            <p className="text-[#6B7280] text-[10px] mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[#E50914]/10 text-[#E50914] font-medium"
                  : "text-[#6B7280] hover:bg-[#141420] hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-[#1E1E2E]">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-[#6B7280] text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#6B7280] hover:bg-[#141420] hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
