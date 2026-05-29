"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clapperboard, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#07070F] flex items-center justify-center px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E50914]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#E50914] rounded-xl flex items-center justify-center mb-4">
            <Clapperboard size={22} className="text-white" />
          </div>
          <h1 className="text-white text-xl font-semibold">A2S Cinemas</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6">
          <h2 className="text-white font-medium mb-5">Sign in to continue</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
           <Input
  label="Email"
  type="email"
  placeholder="admin@a2s.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  autoComplete="email"
  data-testid="login-email"
/>

            <div className="space-y-1.5">
              <label className="text-sm text-gray-400">Password</label>
              <div className="relative">
               <input
  type={showPassword ? "text" : "password"}
  placeholder="••••••••"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  data-testid="login-password"
                  autoComplete="current-password"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#2E2E3E] rounded-lg px-3 py-2.5 pr-10 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#E50914] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

           <Button
  type="submit"
  variant="primary"
  loading={loading}
  className="w-full mt-2"
  data-testid="login-submit-btn"
>
  Sign In
</Button>
          </form>

          <p className="text-gray-600 text-xs text-center mt-4">
            Admin accounts only. User accounts cannot log in here.
          </p>
        </div>
      </div>
    </div>
  );
}
