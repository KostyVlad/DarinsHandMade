import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { API } from "../../api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setMessage(data.msg || "Password updated.");
        setTimeout(() => navigate("/login"), 1800);
      } else {
        setMessage(data.msg || "Reset failed.");
      }
    } catch {
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-93px)] bg-white flex flex-col items-center justify-center px-6 gap-6 text-center">
        <p className="font-['Dorsa',sans-serif] text-[56px] tracking-[6px] text-black">Invalid link</p>
        <p className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-black/60 max-w-[420px]">
          This password reset link is missing its token. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="font-['Centaur:Regular',sans-serif] text-[15px] tracking-[2px] text-black underline underline-offset-4 hover:opacity-60"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-93px)] bg-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <h1
          className="text-black leading-none mb-3 text-center"
          style={{ fontFamily: "'Dorsa', sans-serif", fontSize: "64px", letterSpacing: "6px" }}
        >
          NEW PASSWORD
        </h1>
        <p className="font-['Centaur:Regular',sans-serif] text-black/40 text-[15px] tracking-[2px] text-center mb-12">
          Choose a new password for your account
        </p>

        {done ? (
          <p className="text-center font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-green-700">
            {message} Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
              />
            </div>

            {message && (
              <p className="text-red-500 font-['Centaur:Regular',sans-serif] text-[15px] tracking-[1px]">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase py-4 hover:bg-black/80 transition-colors disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
