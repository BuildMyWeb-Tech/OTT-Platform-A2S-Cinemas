"use client";
import { useState } from "react";
import Link from "next/link";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DeleteAccountPage() {
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const call = async (path: string, body: object) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/delete-account/${path}`, body, { timeout: 20000 });
      return data;
    } catch (e: any) {
      setError(e.response?.data?.message || "Something went wrong. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call("request", { email });
    if (data?.success) {
      setInfo(data.message);
      setStep("code");
    }
  };

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call("confirm", { email, otp: code });
    if (data?.success) setStep("done");
  };

  const input = "w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#E50914]";
  const btn = "w-full bg-[#E50914] hover:bg-[#c40812] text-white font-semibold rounded-lg py-3 disabled:opacity-50 transition-colors";

  return (
    <main className="min-h-screen bg-[#07070F] text-gray-300 flex items-start justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white">Delete your account</h1>
        <p className="text-gray-500 text-sm mt-1">A2S Cinemas</p>

        {step !== "done" && (
          <div className="mt-6 bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 text-sm leading-6">
            <p className="text-white font-medium mb-1">What gets deleted</p>
            <p>Your profile (name, email, mobile number), your reviews, your movie licenses (you will lose access to movies you bought) and your notification token. This cannot be undone.</p>
            <p className="text-white font-medium mt-3 mb-1">What we keep</p>
            <p>Payment records (order IDs and amounts) without any link to your profile, because tax and accounting laws require it.</p>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={sendCode} className="mt-6 space-y-4">
            <label className="block text-sm">
              Email address of your account
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${input} mt-2`} />
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button disabled={loading} className={btn}>{loading ? "Sending..." : "Send verification code"}</button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={confirm} className="mt-6 space-y-4">
            <p className="text-sm text-emerald-400">{info}</p>
            <label className="block text-sm">
              6-digit code from the email
              <input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className={`${input} mt-2 tracking-[0.4em] text-center text-xl`} />
            </label>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button disabled={loading || code.length !== 6} className={btn}>{loading ? "Deleting..." : "Permanently delete my account"}</button>
            <button type="button" onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full text-sm text-gray-500 hover:text-white">
              Use a different email
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="mt-6 bg-[#111118] border border-emerald-500/30 rounded-xl p-5">
            <p className="text-emerald-400 font-semibold">Your account has been deleted.</p>
            <p className="text-sm mt-2">Your personal data has been removed. You can uninstall the app, or sign up again at any time with a new account.</p>
          </div>
        )}

        <p className="mt-8 text-sm text-gray-500">
          <Link href="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
