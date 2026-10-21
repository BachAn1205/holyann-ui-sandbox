"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginData } from "@/lib/types/auth.types";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft } from "lucide-react";

type Step = "email" | "password";

const slide = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
};

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [direction, setDirection] = useState(0);
  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const goTo = (next: Step, d: number) => {
    setDirection(d);
    setErrorMessage("");
    setStep(next);
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email?.trim()) return;
    goTo("password", 1);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });
      if (result?.error) {
        setErrorMessage("Email hoặc mật khẩu không chính xác");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setErrorMessage("Đã xảy ra lỗi trong quá trình đăng nhập");
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
      {/* Logo - minimal */}
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
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Email của bạn là gì?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập email bạn dùng để đăng ký
              </p>
            </div>
            <div className="space-y-4">
              <input
                type="email"
                autoFocus
                value={loginData.email}
                onChange={(e) => {
                  setLoginData((p) => ({ ...p, email: e.target.value }));
                  setErrorMessage("");
                }}
                placeholder="vd: email@example.com"
                required
                className="w-full px-0 py-3 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors"
              />
              <button
                type="submit"
                disabled={!loginData.email?.trim()}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Tiếp tục
                <ArrowRight className="w-4 h-4" />
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
            onSubmit={handleLogin}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => goTo("email", -1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Đổi email
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Nhập mật khẩu
              </h1>
              <p className="mt-2 text-muted-foreground">
                Cho <span className="text-foreground font-medium">{loginData.email}</span>
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
                  type={showPassword ? "text" : "password"}
                  autoFocus
                  value={loginData.password}
                  onChange={(e) => {
                    setLoginData((p) => ({ ...p, password: e.target.value }));
                    setErrorMessage("");
                  }}
                  placeholder="Mật khẩu"
                  required
                  disabled={isLoading}
                  className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-lg placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
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
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Footer - divider and Google login */}
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
          Đăng nhập với Google
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
