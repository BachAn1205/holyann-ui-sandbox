"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { RegisterData } from "@/lib/types/auth.types";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "name" | "email" | "otp" | "password" | "confirm";
type Identity = "student" | "mentor" | null;

const slide = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
};

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [identity, setIdentity] = useState<Identity>("student");
  const [direction, setDirection] = useState(0);
  const [registerData, setRegisterData] = useState<RegisterData>({
    full_name: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const goTo = (next: Step, d: number) => {
    setDirection(d);
    setErrorMessage("");
    setStep(next);
  };

  const handleSubmitName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.full_name?.trim()) return;
    goTo("email", 1);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email?.trim()) return;
    
    setIsSendingOtp(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/register/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerData.email }),
      });
      const result = await response.json();
      if (response.ok) {
        goTo("otp", 1);
      } else {
        setErrorMessage(result.error || "Không thể gửi OTP");
      }
    } catch {
      setErrorMessage("Lỗi kết nối, vui lòng thử lại sau");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMessage("Mã OTP phải gồm 6 chữ số");
      return;
    }
    
    setIsVerifyingOtp(true);
    setErrorMessage("");
    try {
      const response = await fetch("/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerData.email, otp }),
      });
      const result = await response.json();
      if (response.ok) {
        goTo("password", 1);
      } else {
        setErrorMessage(result.error || "Mã OTP không hợp lệ");
      }
    } catch {
      setErrorMessage("Lỗi kết nối, vui lòng thử lại sau");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.password?.trim()) return;
    if (registerData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    goTo("confirm", 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (registerData.password !== confirmPassword) {
      setErrorMessage("Mật khẩu không khớp");
      return;
    }
    if (registerData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.full_name,
        otp,
        role: identity === "mentor" ? "MENTOR" : "STUDENT",
      };
      const response = await fetch("/api/auth/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        router.push("/login");
      } else {
        setErrorMessage(result.error || "Đăng ký thất bại");
      }
    } catch {
      setErrorMessage("Có lỗi xảy ra, vui lòng thử lại sau");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setErrorMessage("Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="w-full">
      <div className="flex pr-35 justify-end w-full mb-12">
        <Link
          href="/"
          className="focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background rounded-lg"
        >
          <Image
            src="/images/logos/logo%20vien.png"
            alt="Holyann"
            width={270}
            height={72}
            className="h-[72px] w-auto object-contain opacity-90 hover:opacity-100 transition-opacity dark:invert dark:brightness-110"
            priority
          />
        </Link>
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {/* Step: Full name */}
        {step === "name" && (
          <motion.form
            key="name"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmitName}
            className="space-y-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Họ và tên của bạn là gì?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập họ tên đầy đủ
              </p>
            </div>
            <div className="space-y-4">
              <input
                data-testid="input-name"
                type="text"
                autoFocus
                value={registerData.full_name}
                onChange={(e) => {
                  setRegisterData((p) => ({ ...p, full_name: e.target.value }));
                  setErrorMessage("");
                }}
                placeholder="Nguyễn Văn A"
                required
                className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
              />
              <button
                data-testid="btn-name-next"
                type="submit"
                disabled={!registerData.full_name?.trim()}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* Step: Email */}
        {step === "email" && (
          <motion.form
            key="email"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmitEmail}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => goTo("name", -1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Email của bạn?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Dùng để đăng nhập và nhận thông báo
              </p>
            </div>
            <div className="space-y-4">
              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </motion.p>
              )}
              <input
                data-testid="input-email"
                type="email"
                autoFocus
                value={registerData.email}
                onChange={(e) => {
                  setRegisterData((p) => ({ ...p, email: e.target.value }));
                  setErrorMessage("");
                }}
                placeholder="vd: email@example.com"
                required
                className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                disabled={isSendingOtp}
              />
              <button
                data-testid="btn-email-next"
                type="submit"
                disabled={!registerData.email?.trim() || isSendingOtp}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {isSendingOtp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Tiếp tục
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <motion.form
            key="otp"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleVerifyOtp}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => goTo("email", -1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại (Đổi email)
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Nhập mã xác thực
              </h1>
              <p className="mt-2 text-muted-foreground">
                Mã 6 chữ số đã được gửi đến {registerData.email}
              </p>
            </div>
            <div className="space-y-4">
              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </motion.p>
              )}
              <input
                data-testid="input-otp"
                type="text"
                autoFocus
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setErrorMessage("");
                }}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full px-0 py-3 bg-transparent text-foreground text-center text-3xl tracking-[0.5em] placeholder:text-muted-foreground/30 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50 font-mono"
                disabled={isVerifyingOtp}
              />
              <button
                data-testid="btn-otp-next"
                type="submit"
                disabled={otp.length !== 6 || isVerifyingOtp}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {isVerifyingOtp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Xác nhận
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}

        {/* Step: Password */}
        {step === "password" && (
          <motion.form
            key="password"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleSubmitPassword}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => goTo("otp", -1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Tạo mật khẩu
              </h1>
              <p className="mt-2 text-muted-foreground">
                Ít nhất 6 ký tự
              </p>
            </div>
            <div className="space-y-4">
              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </motion.p>
              )}
              <div className="relative">
                <input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={registerData.password}
                  onChange={(e) => {
                    setRegisterData((p) => ({ ...p, password: e.target.value }));
                    setErrorMessage("");
                  }}
                  placeholder="Mật khẩu"
                  required
                  minLength={6}
                  className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                data-testid="btn-password-next"
                type="submit"
                disabled={registerData.password.length < 6}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.form>
        )}

        {/* Step: Confirm password */}
        {step === "confirm" && (
          <motion.form
            key="confirm"
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            onSubmit={handleRegister}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => goTo("password", -1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Xác nhận mật khẩu
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập lại mật khẩu để xác nhận
              </p>
            </div>
            <div className="space-y-4">
              {errorMessage && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {errorMessage}
                </motion.p>
              )}
              <div className="relative">
                <input
                  data-testid="input-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoFocus
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Nhập lại mật khẩu"
                  required
                  className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                data-testid="btn-submit-register"
                type="submit"
                disabled={isLoading || confirmPassword !== registerData.password}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Tạo tài khoản"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-12 pt-6 space-y-6">
        <div className="relative flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground shrink-0">hoặc</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2.5 min-h-[48px] py-3.5 rounded-xl text-foreground text-sm font-medium hover:bg-muted/50 dark:hover:bg-muted active:scale-[0.98] border border-transparent dark:border-border/50 transition-all duration-200 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng ký với Google
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
