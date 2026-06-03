"use client";
import { useEffect, useState } from "react";
import { Check, X, Search, Eye } from "lucide-react";
import {
    PageHeader, PageLoader, EmptyState, Badge,
    Table, Pagination, Button,
} from "@/components/ui";
import api from "@/lib/api";

interface Review {
    _id: string;
    movieId: { _id: string; title: string };
    userId: { _id: string; name: string; email: string };
    rating: number;
    comment?: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

function Stars({ rating }: { rating: number }) {
    return (
        <span className="text-amber-400 text-sm">
            {"★".repeat(rating)}{"☆".repeat(5 - rating)}
        </span>
    );
}

const STATUS_VARIANT = {
    pending: "amber", approved: "green", rejected: "red",
} as const;

export default function ReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("pending");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });
    const [selected, setSelected] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const fetchReviews = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "20" });
            if (status !== "all") params.set("status", status);
            if (search.trim()) params.set("search", search.trim());
            const { data } = await api.get(`/reviews/admin/all?${params}`);
            setReviews(data.data || []);
            setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { setPage(1); fetchReviews(1); }, [status]);
    useEffect(() => { const t = setTimeout(() => { setPage(1); fetchReviews(1); }, 300); return () => clearTimeout(t); }, [search]);
    useEffect(() => { fetchReviews(page); }, [page]);

    const moderate = async (id: string, action: "approve" | "reject") => {
        try {
            await api.patch(`/reviews/${id}/${action}`);
            setReviews((prev) => prev.map((r) =>
                r._id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
            ));
        } catch (e) { console.error(e); }
    };

    const bulkModerate = async (action: "approve" | "reject") => {
        if (selected.length === 0) return;
        setBulkLoading(true);
        try {
            await api.patch("/reviews/bulk", { ids: selected, action });
            setSelected([]);
            fetchReviews(page);
        } catch (e) { console.error(e); }
        finally { setBulkLoading(false); }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div>
            <PageHeader
                title="Reviews"
                description={`${pagination.total} reviews`}
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative max-w-sm flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by comment..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                    />
                </div>
                <div className="flex gap-1.5">
                    {["pending", "approved", "rejected", "all"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${status === s ? "bg-[#E50914] text-white" : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk actions */}
            {selected.length > 0 && (
                <div className="flex items-center gap-3 mb-4 bg-[#111118] border border-[#1E1E2E] rounded-lg px-4 py-2.5">
                    <span className="text-gray-400 text-sm">{selected.length} selected</span>
                    <Button variant="secondary" loading={bulkLoading} onClick={() => bulkModerate("approve")}>
                        <Check size={14} />
                        Approve All
                    </Button>
                    <Button variant="danger" loading={bulkLoading} onClick={() => bulkModerate("reject")}>
                        <X size={14} />
                        Reject All
                    </Button>
                    <button onClick={() => setSelected([])} className="text-gray-500 text-sm ml-auto hover:text-white">
                        Clear
                    </button>
                </div>
            )}

            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
                {loading ? (
                    <PageLoader />
                ) : reviews.length === 0 ? (
                    <EmptyState title="No reviews found" />
                ) : (
                    <>
                        <Table headers={["", "Movie", "User", "Rating", "Comment", "Status", "Date", "Actions"]}>
                            {reviews.map((review) => (
                                <tr key={review._id} className="hover:bg-[#1A1A24] transition-colors">
                                    <td className="py-3 px-2">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(review._id)}
                                            onChange={() => toggleSelect(review._id)}
                                            className="accent-[#E50914]"
                                        />
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="text-white text-sm">{review.movieId?.title ?? "—"}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="text-white text-sm">{review.userId?.name ?? "—"}</p>
                                        <p className="text-gray-500 text-xs">{review.userId?.email ?? ""}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Stars rating={review.rating} />
                                    </td>
                                    <td className="py-3 px-4 max-w-[200px]">
                                        <p className="text-gray-400 text-sm truncate">
                                            {review.comment || <span className="text-gray-600 italic">No comment</span>}
                                        </p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge variant={STATUS_VARIANT[review.status]}>{review.status}</Badge>
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="text-gray-400 text-sm">{formatDate(review.createdAt)}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-1">
                                            {review.status !== "approved" && (
                                                <button
                                                    onClick={() => moderate(review._id, "approve")}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                                >
                                                    <Check size={12} />
                                                    Approve
                                                </button>
                                            )}
                                            {review.status !== "rejected" && (
                                                <button
                                                    onClick={() => moderate(review._id, "reject")}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <X size={12} />
                                                    Reject
                                                </button>
                                            )}
                                        </div>
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