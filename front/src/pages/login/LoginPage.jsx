import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage({ setToken }) {
  // Состояния из логики и дизайна
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Функция отправки из первого кода
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // очищаем ошибку перед новым запросом

    const url = isLogin
      ? "http://localhost:5000/api/auth/signin"
      : "http://localhost:5000/api/auth/signup";

    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        navigate("/");
      } else {
        setMessage(data.msg || "Auth failed");
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  // Функция для переключения вкладок с очисткой ошибок
  const toggleLoginMode = (mode) => {
    setIsLogin(mode);
    setMessage("");
  };

  return (
    <div className="min-h-[calc(100vh-93px)] bg-white flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#050000] flex-col items-center justify-center relative overflow-hidden">
        {/* Ornamental border */}
        <div className="absolute inset-6 border border-white/20" />
        <div className="absolute inset-8 border border-white/10" />

        {/* Central content */}
        <div className="relative z-10 text-center px-16">
          <p className="font-['Centaur:Regular',sans-serif] text-white/50 text-[13px] tracking-[4px] uppercase mb-10">
            welcome to
          </p>
          <h1
            className="text-white leading-none mb-4"
            style={{
              fontFamily: "'Dorsa', sans-serif",
              fontSize: "110px",
              letterSpacing: "14px",
            }}
          >
            DARIN'S
          </h1>
          <div className="w-24 h-px bg-white/30 mx-auto my-8" />
          <p className="font-['Centaur:Regular',sans-serif] text-white/60 text-[15px] tracking-[3px] leading-relaxed max-w-[320px]">
            Handmade is a future. Each piece crafted with love and dedication.
          </p>

          {/* Decorative dots */}
          <div className="flex justify-center gap-3 mt-12">
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          </div>
        </div>

        {/* Bottom category links */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8">
          {["bracelets", "beaded bags", "embroidery"].map((cat) => (
            <span
              key={cat}
              className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-white/30 text-[11px] tracking-[2.5px] uppercase"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-12">
            <Link to="/">
              <h2
                className="text-black leading-none"
                style={{
                  fontFamily: "'Dorsa', sans-serif",
                  fontSize: "72px",
                  letterSpacing: "10px",
                }}
              >
                DARIN'S
              </h2>
            </Link>
            <div className="w-16 h-px bg-black/20 mx-auto mt-4" />
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-black/10 mb-12">
            <button
              type="button"
              onClick={() => toggleLoginMode(true)}
              className={`flex-1 pb-4 font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[3px] uppercase transition-all ${
                isLogin
                  ? "text-black border-b-2 border-black -mb-px"
                  : "text-black/30 hover:text-black/60"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleLoginMode(false)}
              className={`flex-1 pb-4 font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[3px] uppercase transition-all ${
                !isLogin
                  ? "text-black border-b-2 border-black -mb-px"
                  : "text-black/30 hover:text-black/60"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2
              className="text-black leading-none mb-3"
              style={{
                fontFamily: "'Dorsa', sans-serif",
                fontSize: "64px",
                letterSpacing: "6px",
              }}
            >
              {isLogin ? "SIGN IN" : "REGISTER"}
            </h2>
            <p className="font-['Centaur:Regular',sans-serif] text-black/40 text-[15px] tracking-[2px]">
              {isLogin
                ? "Access your Darin's account"
                : "Join the Darin's community"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors"
                />
              </div>
            )}

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

            <div className="space-y-2">
              <label className="font-['Perpetua_Titling_MT:Bold',sans-serif] text-[11px] tracking-[3px] text-black/50 uppercase block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border-b border-black/20 pb-3 pt-1 font-['Centaur:Regular',sans-serif] text-[16px] tracking-[2px] text-black placeholder:text-black/25 bg-transparent outline-none focus:border-black transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-3 text-black/30 hover:text-black/60 transition-colors"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <a
                  href="#"
                  className="font-['Centaur:Regular',sans-serif] text-[13px] tracking-[2px] text-black/40 hover:text-black transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Вывод ошибки сервера */}
            {message && (
              <div className="text-red-500 font-['Centaur:Regular',sans-serif] text-[15px] tracking-[1px]">
                {message}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-[#050000] text-white font-['Perpetua_Titling_MT:Bold',sans-serif] text-[13px] tracking-[4px] uppercase py-4 hover:bg-black/80 transition-colors"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-black/10" />
            <span className="font-['Centaur:Regular',sans-serif] text-[12px] tracking-[2px] text-black/30">
              or
            </span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {/* Social */}
          <div className="space-y-3">
            <button className="w-full border border-black/15 py-3.5 font-['Centaur:Regular',sans-serif] text-[14px] tracking-[2px] text-black/60 hover:border-black/40 hover:text-black transition-all flex items-center justify-center gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Toggle link */}
          <p className="text-center mt-10 font-['Centaur:Regular',sans-serif] text-[14px] tracking-[2px] text-black/40">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => toggleLoginMode(!isLogin)}
              className="text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
            >
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}