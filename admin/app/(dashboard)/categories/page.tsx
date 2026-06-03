"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Check, Search, AlertTriangle } from "lucide-react";
import {
    PageHeader, PageLoader, EmptyState, Badge,
    Button, Input, ConfirmDialog, Pagination,
} from "@/components/ui";
import api from "@/lib/api";

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });
    const LIMIT = 15;

    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchCategories = useCallback(async (p = 1, s = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                all: "true", page: String(p), limit: String(LIMIT),
            });
            if (s.trim()) params.set("search", s.trim());
            const { data } = await api.get(`/categories?${params}`);
            setCategories(data.data || []);
            setPagination({ pages: data.pagination?.pages ?? 1, total: data.pagination?.total ?? 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCategories(1, ""); }, []);

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => { setPage(1); fetchCategories(1, search); }, 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { fetchCategories(page, search); }, [page]);

    const startEdit = (cat: Category) => {
        setEditId(cat._id);
        setForm({ name: cat.name, description: cat.description || "" });
        setShowAdd(false);
        setFormError("");
    };

    const cancelEdit = () => { setEditId(null); setForm({ name: "", description: "" }); setFormError(""); };

    const save = async (id?: string) => {
        if (!form.name.trim()) { setFormError("Name is required"); return; }
        setSaving(true);
        setFormError("");
        try {
            if (id) {
                const { data } = await api.put(`/categories/${id}`, form);
                setCategories((prev) => prev.map((c) => c._id === id ? data.data : c));
                setEditId(null);
            } else {
                await api.post("/categories", form);
                setShowAdd(false);
                fetchCategories(1, search); // refresh to get correct pagination
            }
            setForm({ name: "", description: "" });
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Failed to save");
        } finally { setSaving(false); }
    };

    const toggle = async (id: string) => {
        try {
            const { data } = await api.patch(`/categories/${id}/toggle`);
            setCategories((prev) => prev.map((c) => c._id === id ? data.data : c));
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        setDeleteError("");
        try {
            await api.delete(`/categories/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchCategories(page, search);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Delete failed";
            setDeleteError(msg);
        } finally { setDeleteLoading(false); }
    };

    return (
        <div>
            <PageHeader
                title="Categories"
                description={`${pagination.total} categories`}
                action={
                    <Button
                        variant="primary"
                        data-testid="category-add-btn"
                        onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", description: "" }); setFormError(""); }}
                    >
                        <Plus size={16} />
                        Add Category
                    </Button>
                }
            />

            {/* Search */}
            <div className="relative max-w-sm mb-5">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914]"
                />
            </div>

            {/* Add form */}
            {showAdd && (
                <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 mb-5">
                    <h3 className="text-white font-medium text-sm mb-4">New Category</h3>
                    {formError && <p className="text-red-400 text-sm mb-3">{formError}</p>}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input
                            label="Name"
                            placeholder="Action"
                            value={form.name}
                            data-testid="category-name-input"
                            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError(""); }}
                        />
                        <Input
                            label="Description (optional)"
                            placeholder="High-octane action films"
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="primary" loading={saving} data-testid="category-create-btn" onClick={() => save()}>
                            <Check size={14} />
                            Create
                        </Button>
                        <Button variant="secondary" onClick={() => { setShowAdd(false); setFormError(""); }}>
                            <X size={14} />
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl overflow-hidden">
                {loading ? (
                    <PageLoader />
                ) : categories.length === 0 ? (
                    <EmptyState title="No categories found" description={search ? "Try a different search term" : "Add your first category"} />
                ) : (
                    <div className="divide-y divide-[#1E1E2E]">
                        {categories.map((cat) => (
                            <div key={cat._id} className="p-4">
                                {editId === cat._id ? (
                                    <div className="space-y-3">
                                        {formError && <p className="text-red-400 text-sm">{formError}</p>}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input
                                                value={form.name}
                                                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError(""); }}
                                            />
                                            <Input
                                                value={form.description}
                                                placeholder="Description"
                                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="primary" loading={saving} onClick={() => save(cat._id)}>
                                                <Check size={14} />
                                                Save
                                            </Button>
                                            <Button variant="secondary" onClick={cancelEdit}>
                                                <X size={14} />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-white text-sm font-medium">{cat.name}</p>
                                                {cat.slug && (
                                                    <span className="text-gray-600 text-xs font-mono">/{cat.slug}</span>
                                                )}
                                            </div>
                                            {cat.description && (
                                                <p className="text-gray-500 text-xs mt-0.5 truncate">{cat.description}</p>
                                            )}
                                        </div>

                                        <Badge variant={cat.isActive ? "green" : "gray"}>
                                            {cat.isActive ? "Active" : "Inactive"}
                                        </Badge>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => startEdit(cat)}
                                                data-testid={`category-edit-${cat._id}`}
                                                className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => toggle(cat._id)}
                                                data-testid={`category-toggle-${cat._id}`}
                                                className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors"
                                                title={cat.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {cat.isActive ? (
                                                    <ToggleRight size={18} className="text-emerald-400" />
                                                ) : (
                                                    <ToggleLeft size={18} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setDeleteTarget({ id: cat._id, name: cat.name }); setDeleteError(""); }}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!loading && pagination.pages > 1 && (
                    <div className="p-4 border-t border-[#1E1E2E]">
                        <Pagination
                            page={page}
                            pages={pagination.pages}
                            total={pagination.total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Delete dialog — shows movie count error if blocked */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-sm">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 size={18} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Delete "{deleteTarget.name}"?</p>
                                <p className="text-gray-500 text-sm mt-1">This cannot be undone.</p>
                            </div>
                        </div>

                        {deleteError && (
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4">
                                <AlertTriangle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-400 text-sm">{deleteError}</p>
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setDeleteTarget(null); setDeleteError(""); }}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white bg-[#1E1E2E] hover:bg-[#2E2E3E] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            {!deleteError && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deleteLoading ? "Deleting..." : "Delete"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
