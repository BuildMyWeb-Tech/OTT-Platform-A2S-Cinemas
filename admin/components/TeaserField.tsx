"use client";
import { useRef, useState } from "react";
import { Film, X } from "lucide-react";
import { Input, Spinner } from "@/components/ui";
import api from "@/lib/api";

export const MIN_TEASER_SECONDS = 45;
export const MAX_TEASER_SECONDS = 300; // 5 minutes

type TeaserMode = "url" | "upload";

interface UploadState { uploading: boolean; progress: number; error: string; duration: number | null; }
const emptyUpload = (): UploadState => ({ uploading: false, progress: 0, error: "", duration: null });

interface Props {
  mode: TeaserMode;
  onModeChange: (m: TeaserMode) => void;
  trailerUrl: string;
  onTrailerUrlChange: (v: string) => void;
  teaserKey: string;                // "" until a new file is uploaded this session
  onTeaserKeyChange: (key: string) => void;
  onClearTeaser: () => void;        // admin wants to replace/remove the existing teaser
  hasExistingTeaser?: boolean;      // edit mode: server confirmed one is already stored
}

/** Reads video duration client-side before allowing upload — no server-side transcoding available. */
const readDuration = (file: File) =>
  new Promise<number>((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(d);
    };
    video.onerror = () => reject(new Error("Could not read this video file"));
    video.src = URL.createObjectURL(file);
  });

export default function TeaserField({
  mode, onModeChange, trailerUrl, onTrailerUrlChange, teaserKey, onTeaserKeyChange, onClearTeaser, hasExistingTeaser,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>(emptyUpload());

  const handleFile = async (file: File) => {
    setUpload({ ...emptyUpload(), uploading: true });
    try {
      const duration = await readDuration(file);
      if (duration < MIN_TEASER_SECONDS || duration > MAX_TEASER_SECONDS) {
        setUpload({ ...emptyUpload(), error: `This video is ${Math.round(duration)}s long — teasers must be between ${MIN_TEASER_SECONDS}s and ${MAX_TEASER_SECONDS / 60} minutes.` });
        return;
      }
      const { data } = await api.post("/admin/upload-url", { fileName: file.name, fileType: file.type, folder: "teasers" });
      const { uploadUrl, key } = data.data;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUpload((u) => ({ ...u, progress: Math.round((e.loaded / e.total) * 100) }));
        };
        xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      setUpload({ uploading: false, progress: 100, error: "", duration });
      onTeaserKeyChange(key);
    } catch (err: any) {
      setUpload({ ...emptyUpload(), error: err.message || "Upload failed" });
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-[#E50914] text-white" : "bg-[#0A0A0F] text-gray-400 border border-[#1E1E2E] hover:border-[#2E2E3E]"}`;

  const showUploadedState = !!teaserKey || !!hasExistingTeaser;

  return (
    <div className="space-y-3">
      <label className="text-sm text-gray-400">Trailer / Teaser (optional)</label>
      <div className="flex gap-2">
        <button type="button" onClick={() => onModeChange("url")} className={tabClass(mode === "url")}>YouTube / External Link</button>
        <button type="button" onClick={() => onModeChange("upload")} className={tabClass(mode === "upload")}>Upload Teaser Video</button>
      </div>

      {mode === "url" ? (
        <Input placeholder="https://youtube.com/watch?v=..." value={trailerUrl}
          onChange={(e) => onTrailerUrlChange(e.target.value)} />
      ) : (
        <div>
          <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/mpeg" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {!showUploadedState ? (
            <div onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-[#2E2E3E] hover:border-[#E50914] rounded-xl p-6 text-center cursor-pointer transition-colors">
              {upload.uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Spinner size={22} />
                  <p className="text-gray-400 text-sm">Uploading... {upload.progress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Film size={26} className="text-gray-600" />
                  <p className="text-gray-400 text-sm">Click to upload teaser</p>
                  <p className="text-gray-600 text-xs">MP4, MOV — {MIN_TEASER_SECONDS}s to {MAX_TEASER_SECONDS / 60} minutes</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl p-4">
              <div className="w-10 h-10 bg-[#1E1E2E] rounded-lg flex items-center justify-center flex-shrink-0">
                <Film size={18} className="text-[#E50914]" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">Teaser uploaded ✓{upload.duration ? ` (${Math.round(upload.duration)}s)` : ""}</p>
                {!teaserKey && hasExistingTeaser && <p className="text-gray-500 text-xs mt-0.5">Existing teaser kept unless replaced</p>}
              </div>
              <button type="button" onClick={() => { setUpload(emptyUpload()); onClearTeaser(); }}
                className="p-1.5 text-gray-500 hover:text-white" aria-label="Replace teaser">
                <X size={16} />
              </button>
            </div>
          )}
          {upload.error && <p className="text-red-400 text-xs mt-1">{upload.error}</p>}
        </div>
      )}
    </div>
  );
}
