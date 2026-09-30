"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Film, IndianRupee, ShoppingCart, Key, TrendingUp, Smartphone, Activity } from "lucide-react";
import { StatCard, PageLoader, Table, Badge } from "@/components/ui";
import api from "@/lib/api";
import { DashboardStats, Purchase } from "@/lib/types";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
const STATUS_VARIANT = { active: "green", pending: "amber", expired: "gray", failed: "red" } as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Parallel fetch — both calls at same time
    Promise.allSettled([
      api.get("/admin/stats"),
      api.get("/purchases/admin/all?limit=8&page=1"),
    ])
      .then(([statsResult, purchasesResult]) => {
        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value.data.data);
        } else {
          setError("Failed to load stats");
        }
        if (purchasesResult.status === "fulfilled") {
          setPurchases(purchasesResult.value.data.data || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div data-testid="dashboard-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">A2S Cinemas platform overview</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6" data-testid="stats-grid">
        <StatCard label="Total Users"     value={stats?.totalUsers ?? 0}                    icon={Users}         color="blue"  />
        <StatCard label="App Installs"    value={stats?.totalInstalls ?? stats?.totalUsers ?? 0} icon={Smartphone} color="blue"  />
        <StatCard label="Total Movies"    value={stats?.totalMovies ?? 0}                   icon={Film}          color="amber" />
        <StatCard label="Total Revenue"   value={formatCurrency(stats?.totalRevenue ?? 0)}  icon={IndianRupee}   color="green" />
        <StatCard label="Purchases"       value={stats?.totalPurchases ?? 0}                icon={ShoppingCart}  color="red"   />
        <StatCard label="Active Licenses" value={stats?.activeLicenses ?? 0}               icon={Key}           color="gray"  />
      </div>

      {/* Recent purchases */}
      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5" data-testid="recent-purchases-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-gray-500" />
          <h2 className="text-white font-medium text-sm">Recent Purchases</h2>
        </div>
        {purchases.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8" data-testid="no-purchases">No purchases yet</p>
        ) : (
          <Table headers={["User", "Movie", "Amount", "Date", "Status"]}>
            {purchases.map((p) => {
              const user = typeof p.user === "string" ? null : p.user;
              const movie = typeof p.movie === "string" ? null : p.movie;
              return (
                <tr key={p._id} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="py-3 px-4 first:pl-0">
                    <div>
                      <p className="text-white text-sm">{user?.name ?? "—"}</p>
                      <p className="text-gray-500 text-xs">{user?.email ?? "—"}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4"><p className="text-white text-sm">{movie?.title ?? "—"}</p></td>
                  <td className="py-3 px-4"><p className="text-white text-sm font-medium">₹{p.amountPaid}</p></td>
                  <td className="py-3 px-4"><p className="text-gray-400 text-sm">{formatDate(p.purchaseDate || p.createdAt)}</p></td>
                  <td className="py-3 px-4">
                    <Badge variant={(STATUS_VARIANT as any)[p.status] || "gray"}>{p.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      <RecentActivityCard />

      <AppVersionCard />
    </div>
  );
}

function exactDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_BADGE_VARIANT: Record<string, "green" | "amber" | "red" | "blue" | "gray"> = {
  signup: "blue", purchase: "green", pending: "amber", failed: "red", review: "gray",
};

function RecentActivityCard() {
  const [events, setEvents] = useState<{ type: string; message: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/recent-activity?limit=5")
      .then(({ data }) => setEvents((data.data || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 mt-6" data-testid="recent-activity-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-gray-500" />
          <h2 className="text-white font-medium text-sm">Recent Activity</h2>
        </div>
        <Link href="/activity" className="text-[#E50914] text-xs font-medium hover:underline">View all</Link>
      </div>
      {loading ? (
        <PageLoader />
      ) : events.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No activity yet</p>
      ) : (
        <Table headers={["Type", "Details", "Date & Time", "Time Ago"]}>
          {events.map((ev, i) => (
            <tr key={i} className="hover:bg-[#1A1A24] transition-colors">
              <td className="py-3 px-4 first:pl-0">
                <Badge variant={ACTIVITY_BADGE_VARIANT[ev.type] || "gray"}>{ev.type}</Badge>
              </td>
              <td className="py-3 px-4"><p className="text-white text-sm">{ev.message}</p></td>
              <td className="py-3 px-4"><span className="text-gray-400 text-sm">{exactDateTime(ev.time)}</span></td>
              <td className="py-3 px-4"><span className="text-gray-500 text-xs">{timeAgo(ev.time)}</span></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

function AppVersionCard() {
  const [config, setConfig] = useState({ latestVersion: "", minVersion: "", updateMessage: "" });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/config/version")
      .then(({ data }) => setConfig(data.data))
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.patch("/admin/app-config", config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loadingConfig) return null;

  return (
    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 mt-6">
      <h2 className="text-white font-medium text-sm mb-1">App Version (Force Update)</h2>
      <p className="text-gray-500 text-xs mb-4">
        After publishing a new version on Google Play Console, set both fields to that version number
        (e.g. "1.2.0") and save. Any app below "Minimum Required Version" will show a compulsory update
        prompt with no skip option.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Latest Version</label>
          <input
            value={config.latestVersion}
            onChange={(e) => setConfig((c) => ({ ...c, latestVersion: e.target.value }))}
            placeholder="1.2.0"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914]"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">Minimum Required Version</label>
          <input
            value={config.minVersion}
            onChange={(e) => setConfig((c) => ({ ...c, minVersion: e.target.value }))}
            placeholder="1.2.0"
            className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914]"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1.5">Update Message shown to users</label>
        <input
          value={config.updateMessage}
          onChange={(e) => setConfig((c) => ({ ...c, updateMessage: e.target.value }))}
          className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914]"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E50914] text-white hover:bg-[#c40812] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save Version"}
      </button>
    </div>
  );
}