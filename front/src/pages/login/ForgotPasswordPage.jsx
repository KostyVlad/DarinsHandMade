import React, { useState } from 'react';
import { Link } from "react-router-dom";
import api from "../../api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    api
      .post("/api/auth/forgot-password", { email })
      .then((response) => {
        setSent(true);
        setMessage(response.data.message || "If an account exists, a reset link has been sent.");
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setMessage(error.response?.data?.message || "Server error");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-[calc(100vh-93px)] bg-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[420px]">
        <h1
          className="text-black leading-none mb-3 text-center"
          style={{ fontFamily: "'Dorsa', sans-serif", fontSize: "64px", letterSpacing: "6px" }}
        >
          RESET
        </h1>
        <p className="font-['Centaur:Regular',sans-serif] text-black/40 text-[15px] tracking-[2px] text-center mb-12">
          Enter your email and we'll send you a reset link
        </p>

        {sent ? (
          <div className="text-center space-y-8">
            <p className="font-['Centaur:Regular',sans-serif] text-[16px] tracking-[1px] text-black/70 leading-relaxed">
              {message}
            </p>
            <Link
              to="/login"
              className="inline-block bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase px-12 py-4 no-underline hover:bg-black/80 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
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
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            <p className="text-center font-['Centaur:Regular',sans-serif] text-[14px] tracking-[2px] text-black/40">
              <Link to="/login" className="text-black underline underline-offset-4 hover:opacity-60 transition-opacity">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
