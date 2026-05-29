"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, ToggleLeft, ToggleRight, X, Check } from "lucide-react";
import { PageHeader, PageLoader, EmptyState, Badge, Button, Input, ConfirmDialog } from "@/components/ui";
import api from "@/lib/api";
import { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = (cat: Category) => {
    setEditId(cat._id);
    setForm({ name: cat.name, description: cat.description || "" });
    setShowAdd(false);
  };

  const cancelEdit = () => { setEditId(null); setForm({ name: "", description: "" }); };

  const save = async (id?: string) => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (id) {
        await api.put(`/categories/${id}`, form);
        setCategories((prev) => prev.map((c) => c._id === id ? { ...c, ...form } : c));
        setEditId(null);
      } else {
        const { data } = await api.post("/categories", form);
        setCategories((prev) => [...prev, data.data]);
        setShowAdd(false);
      }
      setForm({ name: "", description: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const toggle = async (id: string) => {
    try {
      await api.patch(`/categories/${id}/toggle`);
      setCategories((prev) => prev.map((c) => c._id === id ? { ...c, isActive: !c.isActive } : c));
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${categories.length} categories`}
        action={
          <Button variant="primary"   data-testid="category-add-btn" onClick={() => { setShowAdd(true); setEditId(null); setForm({ name: "", description: "" }); }}>
            <Plus size={16} />
            Add Category
          </Button>
        }
      />

      {/* Add form */}
      {showAdd && (
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 mb-5">
          <h3 className="text-white font-medium text-sm mb-4">New Category</h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="Name"   data-testid="category-name-input"
 placeholder="Action" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }} />
            <Input label="Description (optional)" placeholder="High-octane action films" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button variant="primary"   data-testid="category-create-btn"
 loading={saving} onClick={() => save()}>
              <Check size={14} />
              Create
            </Button>
            <Button variant="secondary" onClick={() => { setShowAdd(false); setError(""); }}>
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
          <EmptyState title="No categories yet" description="Add your first category to organise movies" />
        ) : (
          <div className="divide-y divide-[#1E1E2E]">
            {categories.map((cat) => (
              <div key={cat._id} className="p-4">
                {editId === cat._id ? (
                  <div className="space-y-3">
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <Input value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError(""); }} />
                      <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" />
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
                      <p className="text-white text-sm font-medium">{cat.name}</p>
                      {cat.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{cat.description}</p>}
                    </div>
                    <Badge variant={cat.isActive ? "green" : "gray"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(cat)} data-testid={`category-edit-${cat._id}`} className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggle(cat._id)}   data-testid={`category-toggle-${cat._id}`}
 className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2E2E3E] rounded transition-colors">
                        {cat.isActive ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
