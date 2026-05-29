"use client";
import { useEffect, useState } from "react";
import { ShieldOff, Clock } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, Badge, Table, Pagination, ConfirmDialog, Button } from "@/components/ui";
import api from "@/lib/api";
import { License } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; title: string } | null>(null);
  const [extendTarget, setExtendTarget] = useState<{ id: string; title: string } | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLicenses = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/license/all?page=${p}&limit=15`);
      setLicenses(data.data || []);
      setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLicenses(page); }, [page]);

  const revoke = async () => {
    if (!revokeTarget) return;
    setActionLoading(true);
    try {
      await api.patch(`/license/${revokeTarget.id}/revoke`);
      setLicenses((prev) => prev.map((l) => l._id === revokeTarget.id ? { ...l, isRevoked: true } : l));
      setRevokeTarget(null);
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const extend = async () => {
    if (!extendTarget || !extendDays) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/license/${extendTarget.id}/extend`, { days: Number(extendDays) });
      setLicenses((prev) =>
        prev.map((l) => l._id === extendTarget.id ? { ...l, expiryDate: data.data.expiryDate } : l)
      );
      setExtendTarget(null);
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Licenses" description={`${pagination.total} licenses total`} />

      <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
        {loading ? (
          <PageLoader />
        ) : licenses.length === 0 ? (
          <EmptyState title="No licenses found" />
        ) : (
          <>
            <Table headers={["User", "Movie", "Expires", "Days Left", "Status", "Actions"]}>
              {licenses.map((lic) => {
                const user = typeof lic.user === "string" ? null : lic.user;
                const movie = typeof lic.movie === "string" ? null : lic.movie;
                const dl = daysLeft(lic.expiryDate);
                const isActive = !lic.isRevoked && dl > 0;

                return (
                  <tr key={lic._id} className="hover:bg-[#1A1A24] transition-colors">
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
                      <p className="text-gray-400 text-sm">{formatDate(lic.expiryDate)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${dl <= 3 ? "text-red-400" : dl <= 7 ? "text-amber-400" : "text-emerald-400"}`}>
                        {lic.isRevoked ? "—" : `${dl}d`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={lic.isRevoked ? "red" : isActive ? "green" : "gray"}>
                        {lic.isRevoked ? "Revoked" : isActive ? "Active" : "Expired"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {!lic.isRevoked && (
                          <>
                            <button
                              onClick={() => setExtendTarget({ id: lic._id, title: movie?.title ?? "Movie" })}
                                data-testid={`license-extend-${lic._id}`}

                              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <Clock size={12} />
                              Extend
                            </button>
                            {isActive && (
                              <button
                                onClick={() => setRevokeTarget({ id: lic._id, title: movie?.title ?? "Movie" })}
                                data-testid={`license-revoke-${lic._id}`}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <ShieldOff size={12} />
                                Revoke
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Revoke confirm */}
      <ConfirmDialog
        open={!!revokeTarget}
        title={`Revoke license for "${revokeTarget?.title}"?`}
        description="The user will immediately lose access to this movie."
        confirmLabel="Revoke License"
        confirmVariant="red"
        onConfirm={revoke}
        onCancel={() => setRevokeTarget(null)}
        loading={actionLoading}
      />

      {/* Extend modal */}
      {extendTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-white font-medium mb-1">Extend License</h3>
            <p className="text-gray-500 text-sm mb-4">
              Extending access for &quot;{extendTarget.title}&quot;
            </p>
            <div className="space-y-1.5 mb-5">
              <label className="text-sm text-gray-400">Days to add</label>
              <input
                type="number"
                min="1"
                max="365"
                  data-testid="license-extend-days-input"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#E50914]"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" loading={actionLoading} onClick={extend} className="flex-1"   data-testid="license-extend-days-input">
                Extend
              </Button>
              <Button variant="secondary" onClick={() => setExtendTarget(null)} className="flex-1"   data-testid="license-extend-submit-btn">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
