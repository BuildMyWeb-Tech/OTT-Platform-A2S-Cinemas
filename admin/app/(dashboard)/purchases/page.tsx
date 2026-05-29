"use client";
import { useEffect, useState } from "react";
import { IndianRupee, TrendingUp } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, Badge, Table, Pagination, StatCard } from "@/components/ui";
import api from "@/lib/api";
import { Purchase } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_VARIANT = {
  active: "green", pending: "amber", expired: "gray", failed: "red",
} as const;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchPurchases = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const { data } = await api.get(`/purchases/admin/all?${params}`);
      setPurchases(data.data || []);
      setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
      // Calculate revenue from current page (in a real app you'd get this from backend)
      const revenue = (data.data || []).reduce((sum: number, p: Purchase) => sum + (p.amountPaid || 0), 0);
      if (p === 1) setTotalRevenue(revenue);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchases(1); setPage(1); }, [statusFilter]);
  useEffect(() => { if (page > 1) fetchPurchases(page); }, [page]);

  return (
    <div>
      <PageHeader title="Purchases" description="All payment transactions" />

      {/* Revenue card */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <StatCard label="Total Transactions" value={pagination.total} icon={TrendingUp} color="blue" />
        <StatCard label="Page Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} icon={IndianRupee} color="green" />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-5">
        {["all", "active", "pending", "expired", "failed"].map((s) => (
          <button
            key={s}
            data-testid={`purchase-filter-${s}`}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? "bg-[#E50914] text-white"
                : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"
            }`}
          >
            {s === "all" ? "All" : s}
          </button>
        ))}
      </div>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : purchases.length === 0 ? (
          <EmptyState title="No purchases found" />
        ) : (
          <>
            <Table headers={["User", "Movie", "Amount", "Order ID", "Date", "Status"]}>
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
                    <td className="py-3 px-4">
                      <p className="text-white text-sm">{movie?.title ?? "—"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-white text-sm font-medium">₹{p.amountPaid}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-500 text-xs font-mono truncate max-w-[100px]">{p.razorpayOrderId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-400 text-sm">{formatDate(p.purchaseDate || p.createdAt)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={STATUS_VARIANT[p.status] || "gray"}>{p.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
