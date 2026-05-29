"use client";
import { useEffect, useState } from "react";
import { Search, ShieldOff, ShieldCheck } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, Badge, Table, Pagination, ConfirmDialog } from "@/components/ui";
import api from "@/lib/api";
import { AdminUser } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [confirm, setConfirm] = useState<{ id: string; action: "block" | "unblock"; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "15" });
      if (search) params.set("search", search);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.data || []);
      setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(1); setPage(1); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1);
  };

  const handleBlockUnblock = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${confirm.id}/${confirm.action}`);
      setUsers((prev) =>
        prev.map((u) => u._id === confirm.id ? { ...u, isBlocked: confirm.action === "block" } : u)
      );
      setConfirm(null);
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const filtered = search
    ? users.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <div>
      <PageHeader title="Users" description={`${pagination.total} registered users`} />

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-sm mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
            data-testid="user-search-input"

          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
        />
      </form>

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <>
            <Table headers={["User", "Role", "Purchases", "Joined", "Status", "Action"]}>
              {filtered.map((user) => (
                <tr key={user._id} className="hover:bg-[#1A1A24] transition-colors">
                  <td className="py-3 px-4 first:pl-0">
                    <div>
                      <p className="text-white text-sm font-medium">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === "admin" ? "red" : "gray"}>{user.role}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm">{user.purchasedMovies?.length ?? 0}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-400 text-sm">{formatDate(user.createdAt)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={user.isBlocked ? "red" : "green"}>
                      {user.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {user.role !== "admin" && (
                      <button
                        data-testid={`user-block-btn-${user._id}`}
                        onClick={() =>
                          setConfirm({
                            id: user._id,
                            action: user.isBlocked ? "unblock" : "block",
                            name: user.name,
                          })
                        }
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          user.isBlocked
                            ? "text-emerald-400 hover:bg-emerald-500/10"
                            : "text-red-400 hover:bg-red-500/10"
                        }`}
                      >
                        {user.isBlocked ? (
                          <><ShieldCheck size={13} /> Unblock</>
                        ) : (
                          <><ShieldOff size={13} /> Block</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.action === "block" ? `Block ${confirm?.name}?` : `Unblock ${confirm?.name}?`}
        description={
          confirm?.action === "block"
            ? "This user will lose access to all features and cannot log in."
            : "This user will regain full access to the platform."
        }
        confirmLabel={confirm?.action === "block" ? "Block User" : "Unblock User"}
        confirmVariant={confirm?.action === "block" ? "red" : "amber"}
        onConfirm={handleBlockUnblock}
        onCancel={() => setConfirm(null)}
        loading={actionLoading}
      />
    </div>
  );
}
