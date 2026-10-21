"use client";
import { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendOtp = async () => {
    if (!email) {
      setError("Vui lòng nhập email trước khi gửi lại mã");
      return;
    }
    
    setResendLoading(true);
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
        setMessage("Mã xác thực đã được gửi lại vào email của bạn.");
      } else {
        setError(data.error || "Có lỗi xảy ra khi gửi lại mã. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (step === 1) {
      setLoading(true);
      try {
        const verifyResponse = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          setError(verifyData.error || "Mã xác thực không đúng");
        } else {
          setStep(2);
        }
      } catch (err) {
        console.error("Verify OTP error:", err);
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      const resetResponse = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const resetData = await resetResponse.json();

      if (resetResponse.ok) {
        setMessage("Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(resetData.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Reset password error:", err);
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
                Đặt Lại Mật Khẩu
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập mã xác thực và mật khẩu mới
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
                className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                placeholder="Email của bạn"
                required
                disabled={loading || !!emailFromQuery || step === 2}
              />

              <div className="relative">
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                  placeholder="Mã xác thực 6 số"
                  maxLength={6}
                  required
                  disabled={loading || step === 2}
                />
              </div>

              {step === 2 && (
                <>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                      placeholder="Mật khẩu mới"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showNew ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                      placeholder="Xác nhận mật khẩu mới"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl mt-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Đang xử lý..." : step === 1 ? "Xác thực mã OTP" : "Đặt Lại Mật Khẩu"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || loading}
              className="block w-full text-center text-sm text-accent hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendLoading ? "Đang gửi lại..." : "Gửi lại mã xác thực"}
            </button>
            <Link
              href="/login"
              className="block text-sm text-muted-foreground hover:text-accent hover:underline"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/30"><span className="text-muted-foreground">Đang tải...</span></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
