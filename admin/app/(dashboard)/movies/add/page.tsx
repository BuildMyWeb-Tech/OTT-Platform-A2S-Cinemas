"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, Input, Select, Textarea, Button } from "@/components/ui";
import api from "@/lib/api";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"];

interface MovieForm {
  title: string;
  description: string;
  genre: string;
  price: string;
  poster: string;
  videoKey: string;
  trailerUrl: string;
  duration: string;
  expiryDays: string;
  isFeatured: boolean;
}

const EMPTY: MovieForm = {
  title: "", description: "", genre: "Action",
  price: "", poster: "", videoKey: "", trailerUrl: "",
  duration: "", expiryDays: "30", isFeatured: false,
};

export default function AddMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState<MovieForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<MovieForm>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key: keyof MovieForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errs: Partial<MovieForm> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errs.price = "Valid price required";
    if (!form.poster.trim()) errs.poster = "Poster URL is required";
    if (!form.videoKey.trim()) errs.videoKey = "Video key is required";
    if (!form.expiryDays || Number(form.expiryDays) <= 0)
      errs.expiryDays = "Valid expiry days required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs as any); return; }
    setLoading(true);
    setServerError("");
    try {
      await api.post("/movies", {
        title: form.title.trim(),
        description: form.description.trim(),
        genre: form.genre,
        price: Number(form.price),
        poster: form.poster.trim(),
        videoKey: form.videoKey.trim(),
        trailerUrl: form.trailerUrl.trim() || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        expiryDays: Number(form.expiryDays),
        isFeatured: form.isFeatured,
      });
      router.push("/movies");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to create movie");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <Link href="/movies" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors mb-4">
          <ArrowLeft size={15} />
          Back to Movies
        </Link>
        <PageHeader title="Add Movie" description="Add a new movie to the platform" />
      </div>

      <div className="max-w-2xl">
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 space-y-5">
          {/* Basic info */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Basic Info</h3>
            <div className="space-y-4">
              <Input label="Title" data-testid="movie-title-input" placeholder="Enter movie title" value={form.title} onChange={set("title")} error={errors.title} />
              <Textarea
                label="Description"
                placeholder="Movie description..."
                value={form.description}
                onChange={set("description")}
                error={errors.description}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Genre" value={form.genre} onChange={set("genre")}>
                  {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
                <div className="space-y-1.5">
                  <label className="text-sm text-gray-400">Featured</label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                      type="button"
                        data-testid="movie-featured-toggle"
                      onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
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

          {/* Pricing */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Pricing & Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)"   data-testid="movie-price-input" type="number" min="1" placeholder="49" value={form.price} onChange={set("price")} error={errors.price} />
              <Input label="Access Days" type="number" min="1" placeholder="30" value={form.expiryDays} onChange={set("expiryDays")} error={errors.expiryDays} />
            </div>
          </div>

          {/* Media */}
          <div>
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">Media</h3>
            <div className="space-y-4">
              <Input label="Poster URL"   data-testid="movie-poster-input" placeholder="https://images.unsplash.com/..." value={form.poster} onChange={set("poster")} error={errors.poster} />
              {form.poster && (
                <div className="w-20 h-28 rounded overflow-hidden bg-[#1E1E2E]">
                  <img src={form.poster} alt="poster preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <Input label="Video Key (S3 path)"   data-testid="movie-videokey-input"
  placeholder="videos/movie-filename.mp4" value={form.videoKey} onChange={set("videoKey")} error={errors.videoKey} />
              <Input label="Trailer URL (optional)" placeholder="https://commondatastorage.googleapis.com/..." value={form.trailerUrl} onChange={set("trailerUrl")} />
              <Input label="Duration (minutes, optional)" type="number" placeholder="120" value={form.duration} onChange={set("duration")} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" data-testid="movie-create-btn" variant="primary" loading={loading} className="flex-1">
              Create Movie
            </Button>
            <Link href="/movies" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
