"use client";
import { useEffect, useState } from "react";
import { Users, Film, IndianRupee, ShoppingCart, Key, TrendingUp } from "lucide-react";
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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6" data-testid="stats-grid">
        <StatCard label="Total Users"     value={stats?.totalUsers ?? 0}                    icon={Users}         color="blue"  />
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
    </div>
  );
}