"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, X, Film, Image as ImageIcon } from "lucide-react";
import { PageHeader, Input, Select, Textarea, Button, Spinner } from "@/components/ui";
import api from "@/lib/api";

const GENRES = ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"];

interface UploadState {
  file: File | null;
  progress: number;
  url: string;
  uploading: boolean;
  error: string;
}

const emptyUpload = (): UploadState => ({
  file: null, progress: 0, url: "", uploading: false, error: "",
});

export default function AddMoviePage() {
  const router = useRouter();
  const posterInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", description: "", genre: "Action",
    price: "", expiryDays: "30", trailerUrl: "",
    duration: "", isFeatured: false,
  });
  const [poster, setPoster] = useState<UploadState>(emptyUpload());
  const [video, setVideo] = useState<UploadState>(emptyUpload());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const setField = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  // Upload poster to Cloudinary
  const uploadPoster = async (file: File) => {
    setPoster((p) => ({ ...p, file, uploading: true, error: "", progress: 0 }));
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "a2s_posters";

      if (!cloudName) {
        // Cloudinary not configured — use URL input fallback
        setPoster((p) => ({ ...p, uploading: false, error: "Cloudinary not configured — use URL input" }));
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("folder", "a2s-cinemas/posters");

      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setPoster((p) => ({ ...p, progress: Math.round((e.loaded / e.total) * 100) }));
        }
      };

      const result = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.response);
            resolve(data.secure_url);
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        xhr.send(formData);
      });

      setPoster((p) => ({ ...p, url: result, uploading: false, progress: 100 }));
    } catch (err: any) {
      setPoster((p) => ({ ...p, uploading: false, error: err.message || "Upload failed" }));
    }
  };

  // Upload video to S3 via backend presigned URL
  const uploadVideo = async (file: File) => {
    setVideo((v) => ({ ...v, file, uploading: true, error: "", progress: 0 }));
    try {
      // Get presigned URL from backend
      const { data } = await api.post("/admin/upload-url", {
        fileName: file.name,
        fileType: file.type,
        folder: "videos",
      });

      const { uploadUrl, key } = data.data;

      // Upload directly to S3
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setVideo((v) => ({ ...v, progress: Math.round((e.loaded / e.total) * 100) }));
          }
        };
        xhr.onload = () => xhr.status === 200 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setVideo((v) => ({ ...v, url: key, uploading: false, progress: 100 }));
    } catch (err: any) {
      setVideo((v) => ({ ...v, uploading: false, error: err.message || "Upload failed" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = "Valid price required";
    if (!poster.url) errs.poster = "Poster image is required";
    if (!video.url) errs.video = "Video file is required";
    if (!form.expiryDays || Number(form.expiryDays) <= 0) errs.expiryDays = "Valid expiry days required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setServerError("");
    try {
      await api.post("/movies", {
        title: form.title.trim(),
        description: form.description.trim(),
        genre: form.genre,
        price: Number(form.price),
        poster: poster.url,
        videoKey: video.url,
        trailerUrl: form.trailerUrl.trim() || undefined,
        duration: form.duration ? Number(form.duration) : undefined,
        expiryDays: Number(form.expiryDays),
        isFeatured: form.isFeatured,
      });
      router.push("/movies");
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Failed to create movie");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link href="/movies" className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4">
        <ArrowLeft size={15} />Back to Movies
      </Link>
      <PageHeader title="Add Movie" description="Upload video and poster, then fill in details" />

      <div className="max-w-2xl">
        {serverError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
            <p className="text-red-400 text-sm">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Poster upload */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">
              Poster Image (Cloudinary)
            </h3>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPoster(e.target.files[0])}
            />
            {!poster.url ? (
              <div>
                <div
                  onClick={() => posterInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${errors.poster ? "border-red-500" : "border-[#2E2E3E] hover:border-[#E50914]"}`}
                >
                  {poster.uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size={24} />
                      <p className="text-gray-400 text-sm">{poster.progress}%</p>
                      <div className="w-32 h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E50914] transition-all" style={{ width: `${poster.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon size={32} className="text-gray-600" />
                      <p className="text-gray-400 text-sm">Click to upload poster</p>
                      <p className="text-gray-600 text-xs">JPG, PNG, WebP — max 5MB</p>
                    </div>
                  )}
                </div>
                {poster.error && <p className="text-red-400 text-xs mt-1">{poster.error}</p>}
                {errors.poster && <p className="text-red-400 text-xs mt-1">{errors.poster}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <img src={poster.url} alt="poster" className="w-16 h-20 object-cover rounded" />
                <div className="flex-1">
                  <p className="text-white text-sm">Poster uploaded ✓</p>
                  <p className="text-gray-500 text-xs truncate mt-0.5">{poster.url.slice(0, 60)}...</p>
                </div>
                <button type="button" onClick={() => setPoster(emptyUpload())} className="p-1.5 text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Video upload */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5">
            <h3 className="text-white font-medium text-sm mb-4 pb-2 border-b border-[#1E1E2E]">
              Video File (AWS S3)
            </h3>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/mov,video/avi"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
            />
            {!video.url ? (
              <div>
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${errors.video ? "border-red-500" : "border-[#2E2E3E] hover:border-[#E50914]"}`}
                >
                  {video.uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Spinner size={24} />
                      <p className="text-gray-400 text-sm">Uploading to S3... {video.progress}%</p>
                      <div className="w-48 h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
                        <div className="h-full bg-[#E50914] transition-all" style={{ width: `${video.progress}%` }} />
                      </div>
                      <p className="text-gray-600 text-xs">Large files may take a few minutes</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Film size={32} className="text-gray-600" />
                      <p className="text-gray-400 text-sm">Click to upload video</p>
                      <p className="text-gray-600 text-xs">MP4, MOV — any size (direct S3 upload)</p>
                    </div>
                  )}
                </div>
                {video.error && <p className="text-red-400 text-xs mt-1">{video.error}</p>}
                {errors.video && <p className="text-red-400 text-xs mt-1">{errors.video}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1E1E2E] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Film size={20} className="text-[#E50914]" />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">Video uploaded to S3 ✓</p>
                  <p className="text-gray-500 text-xs font-mono mt-0.5">{video.url}</p>
                </div>
                <button type="button" onClick={() => setVideo(emptyUpload())} className="p-1.5 text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Movie details */}
          <div className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 space-y-4">
            <h3 className="text-white font-medium text-sm pb-2 border-b border-[#1E1E2E]">Movie Details</h3>
            <Input label="Title" placeholder="Enter movie title" value={form.title} onChange={setField("title")} error={errors.title} data-testid="movie-title-input" />
            <Textarea label="Description" placeholder="Movie description..." value={form.description} onChange={setField("description")} error={errors.description} rows={3} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Genre" value={form.genre} onChange={setField("genre")}>
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
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" min="1" placeholder="49" value={form.price} onChange={setField("price")} error={errors.price} data-testid="movie-price-input" />
              <Input label="Access Days" type="number" min="1" placeholder="30" value={form.expiryDays} onChange={setField("expiryDays")} error={errors.expiryDays} />
            </div>
            <Input label="Trailer URL (optional)" placeholder="https://commondatastorage.googleapis.com/..." value={form.trailerUrl} onChange={setField("trailerUrl")} />
            <Input label="Duration (minutes, optional)" type="number" placeholder="120" value={form.duration} onChange={setField("duration")} />
          </div>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" loading={saving} className="flex-1" data-testid="movie-create-btn">
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
