"use client";
import { useEffect, useState } from "react";
import { PageHeader, PageLoader, EmptyState, Table, Pagination, Badge } from "@/components/ui";
import PhoneCell from "@/components/PhoneCell";
import api from "@/lib/api";

interface MarketingUser {
  _id: string;
  name: string;
  phone?: string;
  whatsappGroupJoined: boolean;
  createdAt: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function MarketingPage() {
  const [users, setUsers] = useState<MarketingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [joinedFilter, setJoinedFilter] = useState<"all" | "yes" | "no">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (search) params.set("search", search);
      if (joinedFilter !== "all") params.set("joined", joinedFilter);
      const { data } = await api.get(`/admin/marketing?${params}`);
      setUsers(data.data || []);
      setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1); setPage(1); }, [joinedFilter]);
  useEffect(() => { if (page > 1) fetchUsers(page); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const toggleJoined = async (user: MarketingUser) => {
    setTogglingId(user._id);
    try {
      const { data } = await api.patch(`/admin/marketing/${user._id}/whatsapp`, { joined: !user.whatsappGroupJoined });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, whatsappGroupJoined: data.data.whatsappGroupJoined } : u)));
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  return (
    <div>
      <PageHeader title="Marketing" description="Users to add to the WhatsApp group" />

      <div className="flex items-center gap-3 mb-5">
        <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
          />
        </form>
        <div className="flex gap-2">
          {(["all", "no", "yes"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setJoinedFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                joinedFilter === f
                  ? "bg-[#E50914] text-white"
                  : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "yes" ? "Joined" : "Not Joined"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <Table headers={["Name", "Phone", "Signed Up", "WhatsApp Group"]}>
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="py-3 px-4 first:pl-0">
                    <p className="text-white text-sm font-medium">{u.name}</p>
                  </td>
                  <td className="py-3 px-4">
                    <PhoneCell phone={u.phone} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm">{formatDate(u.createdAt)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      disabled={togglingId === u._id}
                      onClick={() => toggleJoined(u)}
                      className="flex items-center gap-2 disabled:opacity-50"
                    >
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          u.whatsappGroupJoined ? "bg-emerald-500" : "bg-[#2E2E3E]"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            u.whatsappGroupJoined ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                      <Badge variant={u.whatsappGroupJoined ? "green" : "gray"}>
                        {u.whatsappGroupJoined ? "Yes" : "No"}
                      </Badge>
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
