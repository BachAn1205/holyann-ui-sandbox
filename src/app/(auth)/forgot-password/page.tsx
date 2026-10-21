"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        setError(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-x-hidden overflow-y-auto transition-colors duration-300 dark:auth-page-grid">
      {/* Left: Marketing section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex md:w-[50%] lg:w-[52%] min-h-[40vh] md:min-h-screen relative flex-col justify-center px-6 sm:px-8 lg:px-14 xl:px-20 py-10 md:py-12 shrink-0 overflow-hidden"
      >
        {/* Light mode: full-cover illustration from Login Page.webp */}
        <div
          className="absolute inset-0 dark:hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/backgrounds/Login Page.webp')" }}
          aria-hidden
        />

        {/* Dark mode: full-cover illustration */}
        <div
          className="absolute inset-0 hidden dark:block bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/backgrounds/(dark mode) Login Page.webp')",
          }}
          aria-hidden
        />
      </motion.div>

      {/* Divider between left and right (hidden in dark mode) */}
      <div className="hidden md:block dark:hidden w-px min-h-screen bg-border/50 shrink-0" aria-hidden />

      {/* Right: Auth section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className="w-full md:w-[50%] lg:w-[48%] min-h-[60vh] md:min-h-screen flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 xl:p-16 bg-background relative"
      >
        <div className="w-full max-w-[400px]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Quên Mật Khẩu?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập email của bạn để nhận mã xác thực
              </p>
            </div>

            {/* Success Message */}
            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-600 dark:text-green-400"
              >
                {message}
              </motion.p>
            )}

            {/* Error Message */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}

            <div className="space-y-4">
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
                placeholder="Nhập email của bạn"
                required
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Đang gửi..." : "Gửi Mã Xác Thực"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-accent hover:underline font-medium"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
