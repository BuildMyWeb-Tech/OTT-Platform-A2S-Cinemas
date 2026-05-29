"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Input, Select, Textarea, Button, PageLoader } from "@/components/ui";
import api from "@/lib/api";
import { Movie } from "@/lib/types";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"];

export default function EditMoviePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/movies/${params.id}`)
      .then(({ data }) => {
        setMovie(data.data);
        const m = data.data;
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
      })
      .catch(() => setError("Movie not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f: any) => ({ ...f, [key]: e.target.value }));

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
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isFeatured ? "bg-[#E50914]" : "bg-[#1E1E2E]"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.isFeatured ? "translate-x-4.5" : "translate-x-0.5"}`} />
                    </button>
                    <span className="text-sm text-gray-400">{form.isFeatured ? "Yes" : "No"}</span>
                  </div>
                </div>
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
