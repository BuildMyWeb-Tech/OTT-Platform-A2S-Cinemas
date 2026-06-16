"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ToggleLeft, ToggleRight, Pencil, BarChart2, Star, Trash2 } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, Badge, Button, Pagination, ConfirmDialog } from "@/components/ui";
import api from "@/lib/api";
import { Movie } from "@/lib/types";

interface Category { _id: string; name: string; slug: string; isActive: boolean; }

export default function MoviesPage() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        api.get("/categories?all=true").then(({ data }) => setCategories(data.data || []));
    }, []);

    const fetchMovies = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(p), limit: "10" });
            if (categoryFilter !== "All") params.set("category", categoryFilter);
            if (search) params.set("search", search);
            const { data } = await api.get(`/movies?${params}`);
            setMovies(data.data || []);
            setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMovies(1); setPage(1); }, [categoryFilter]);
    useEffect(() => { fetchMovies(page); }, [page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchMovies(1);
    };

    const toggleActive = async (id: string) => {
        setTogglingId(id);
        try {
            await api.patch(`/movies/${id}/toggle`);
            setMovies((prev) => prev.map((m) => m._id === id ? { ...m, isActive: !m.isActive } : m));
        } catch (e) { console.error(e); }
        finally { setTogglingId(null); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/movies/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchMovies(page);
        } catch (e) {
            console.error(e);
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Movies"
                description={`${pagination.total} movies in total`}
                action={
                    <Link href="/movies/add">
                        <Button variant="primary" data-testid="movie-add-btn">
                            <Plus size={16} />
                            Add Movie
                        </Button>
                    </Link>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search movies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        data-testid="movie-search-input"
                        className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                    />
                </form>
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setCategoryFilter("All")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            categoryFilter === "All"
                                ? "bg-[#E50914] text-white"
                                : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"
                        }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => setCategoryFilter(cat.slug)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                categoryFilter === cat.slug
                                    ? "bg-[#E50914] text-white"
                                    : "bg-[#111118] border border-[#1E1E2E] text-gray-400 hover:text-white"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
                {loading ? (
                    <PageLoader />
                ) : movies.length === 0 ? (
                    <EmptyState
                        title="No movies found"
                        description="Try a different search or category filter"
                        action={
                            <Link href="/movies/add">
                                <Button variant="secondary" data-testid="movie-add-btn">
                                    <Plus size={15} />
                                    Add your first movie
                                </Button>
                            </Link>
                        }
                    />
                ) : (
                    <div className="p-5">
                        <div className="space-y-2">
                            {movies.map((movie) => {
                                const categoryLabel = (movie.categories && movie.categories.length > 0)
                                    ? movie.categories.map((c: any) => c.name).join(", ")
                                    : movie.genre;
                                return (
                                <div
                                    key={movie._id}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#1A1A24] transition-colors"
                                >
                                    {/* Poster */}
                                    <div className="w-10 h-14 bg-[#1E1E2E] rounded overflow-hidden flex-shrink-0">
                                        {movie.poster ? (
                                            <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">No img</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-gray-500 text-xs">{categoryLabel}</span>
                                            <span className="text-gray-700">·</span>
                                            <span className="text-gray-500 text-xs">₹{movie.price}</span>
                                            <span className="text-gray-700">·</span>
                                            <span className="text-gray-500 text-xs">{movie.expiryDays}d access</span>
                                            {movie.ratings?.average > 0 && (
                                                <>
                                                    <span className="text-gray-700">·</span>
                                                    <span className="text-amber-400 text-xs">
                                                        ★ {movie.ratings.average.toFixed(1)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Featured badge */}
                                    {movie.isFeatured && <Badge variant="amber">Featured</Badge>}

                                    {/* Status badge */}
                                    <Badge variant={movie.isActive ? "green" : "gray"}>
                                        {movie.isActive ? "Active" : "Inactive"}
                                    </Badge>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Link href={`/movies/analytics/${movie._id}`}>
                                            <button
                                                className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                title="Analytics"
                                            >
                                                <BarChart2 size={15} />
                                            </button>
                                        </Link>

                                        <Link href={`/reviews?movieId=${movie._id}`}>
                                            <button
                                                className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                                                title="Reviews"
                                            >
                                                <Star size={15} />
                                            </button>
                                        </Link>

                                        <Link href={`/movies/${movie._id}/edit`} data-testid={`edit-movie-${movie._id}`}>
                                            <button className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors">
                                                <Pencil size={14} />
                                            </button>
                                        </Link>

                                        <button
                                            onClick={() => toggleActive(movie._id)}
                                            data-testid={`toggle-movie-${movie._id}`}
                                            disabled={togglingId === movie._id}
                                            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors disabled:opacity-50"
                                            title={movie.isActive ? "Deactivate" : "Activate"}
                                        >
                                            {movie.isActive ? (
                                                <ToggleRight size={18} className="text-emerald-400" />
                                            ) : (
                                                <ToggleLeft size={18} />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setDeleteTarget({ id: movie._id, title: movie.title })}
                                            data-testid={`delete-movie-${movie._id}`}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
                        </div>

                        <Pagination
                            page={page}
                            pages={pagination.pages}
                            total={pagination.total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title={`Delete "${deleteTarget?.title}"?`}
                description="This permanently removes the movie, its video file from S3, and cannot be undone."
                confirmLabel="Delete"
                confirmVariant="red"
                loading={deleteLoading}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}