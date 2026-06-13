"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, ChevronDown, Check } from "lucide-react";
import { PageHeader, Input, Select, Textarea, Button, PageLoader } from "@/components/ui";
import api from "@/lib/api";
import { Movie } from "@/lib/types";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"];

interface Category { _id: string; name: string; slug: string; isActive: boolean; }

export default function EditMoviePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [form, setForm] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/movies/${params.id}`),
      api.get("/categories?all=true"),
    ]).then(([movieRes, catRes]) => {
      const m = movieRes.data.data;
      setMovie(m);
      setForm({
        title: m.title,
        description: m.description,
        genre: m.genre,
        price: String(m.price),
        poster: m.poster,
        videoKey: m.videoKey,
        trailerUrl: m.trailerUrl || "",
        duration: m.duration ? String(m.duration) : "",
        expiryDays: String(m.expiryDays),
        isFeatured: m.isFeatured,
        isActive: m.isActive,
      });
      setCategories(catRes.data.data || []);

      // Pre-select existing categories — handle both populated objects and raw IDs
      const existingCatIds = (m.categories || []).map((c: any) =>
        typeof c === "string" ? c : c._id
      );
      setSelectedCategories(existingCatIds);
    })
      .catch(() => setError("Movie not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Click-outside to close category dropdown
  useEffect(() => {
    if (!catDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [catDropdownOpen]);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f: any) => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectedNames = categories.filter((c) => selectedCategories.includes(c._id)).map((c) => c.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/movies/${params.id}`, {
        title: form.title,
        description: form.description,
        genre: form.genre,
        price: Number(form.price),
        poster: form.poster,
        videoKey: form.videoKey,
        trailerUrl: form.trailerUrl || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        expiryDays: Number(form.expiryDays),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        categories: selectedCategories,
      });
      router.push("/movies");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update movie");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Link href="/movies" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors mb-4">
        <ArrowLeft size={15} />
        Back to Movies
      </Link>
      <PageHeader title={`Edit: ${movie?.title}`} description="Update movie details" />

      <div className="max-w-2xl">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Basic Info</h3>
            <div className="space-y-4">
              <Input label="Title" value={form.title || ""} onChange={set("title")} />
              <Textarea label="Description" value={form.description || ""} onChange={set("description")} rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Genre" value={form.genre || ""} onChange={set("genre")}>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400">Featured</label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      type="button"
                      onClick={() => setForm((f: any) => ({ ...f, isFeatured: !f.isFeatured }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${form.isFeatured ? "bg-[#E50914]" : "bg-[#2E2E3E]"}`}
                    >
                      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${form.isFeatured ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="text-sm text-gray-400">{form.isFeatured ? "Featured" : "Not Featured"}</span>
                  </div>
                </div>
              </div>

              {/* Categories — dynamic, pre-selected */}
              <div className="space-y-1.5">
                <label className="text-sm text-gray-400">Categories</label>
                <div className="relative" ref={catDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-left flex items-center justify-between transition-colors hover:border-[#2E2E3E]"
                  >
                    <span className={selectedCategories.length > 0 ? "text-white text-sm" : "text-gray-600 text-sm"}>
                      {selectedCategories.length > 0 ? selectedNames.join(", ") : "Select categories..."}
                    </span>
                    <ChevronDown size={15} className="text-gray-500" />
                  </button>
                  {catDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#111118] border border-[#1E1E2E] rounded-lg overflow-hidden z-20 max-h-48 overflow-y-auto">
                      {categories.length === 0 ? (
                        <p className="text-gray-500 text-sm px-3 py-2">No categories yet</p>
                      ) : (
                        categories.map((cat) => (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => toggleCategory(cat._id)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1E1E2E] text-left transition-colors"
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${selectedCategories.includes(cat._id) ? "bg-[#E50914] border-[#E50914]" : "border-[#2E2E3E]"}`}>
                              {selectedCategories.includes(cat._id) && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-white text-sm">{cat.name}</span>
                            {!cat.isActive && <span className="text-gray-600 text-xs ml-auto">Inactive</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedNames.map((name, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E50914]/10 text-[#E50914] text-xs rounded-full">
                        {name}
                        <button type="button" onClick={() => toggleCategory(selectedCategories[i])}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Pricing & Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" value={form.price || ""} onChange={set("price")} />
              <Input label="Access Days" type="number" value={form.expiryDays || ""} onChange={set("expiryDays")} />
            </div>
          </div>

          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Media</h3>
            <div className="space-y-4">
              <Input label="Poster URL" value={form.poster || ""} onChange={set("poster")} />
              {form.poster && (
                <div className="w-20 h-28 rounded overflow-hidden bg-[#1E1E2E]">
                  <img src={form.poster} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input label="Video Key (S3 path)" value={form.videoKey || ""} onChange={set("videoKey")} />
              <Input label="Trailer URL (optional)" value={form.trailerUrl || ""} onChange={set("trailerUrl")} />
              <Input label="Duration (minutes)" type="number" value={form.duration || ""} onChange={set("duration")} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" loading={saving} className="flex-1">Save Changes</Button>
            <Link href="/movies" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}