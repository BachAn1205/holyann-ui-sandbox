'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Đổi mật khẩu thành công!');
        setTimeout(() => {
          router.push('/student/settings');
        }, 1500);
      } else {
        setError(data.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
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
        transition={{ duration: 0.5, ease: 'easeOut' }}
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

      {/* Right: Form section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: 'easeOut' }}
        className="w-full md:w-[50%] lg:w-[48%] min-h-[65vh] md:min-h-screen flex flex-col justify-center items-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20 bg-background relative"
      >
        {/* Theme toggle */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8">
          <ThemeToggle
            variant="icon"
            className="rounded-full border border-border bg-muted/30 hover:bg-muted/50"
          />
        </div>

        <div className="w-full max-w-[480px]">
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 -ml-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </motion.button>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-semibold tracking-tight text-foreground">
                Đổi mật khẩu của bạn
              </h1>
              <p className="mt-2 text-muted-foreground">
                Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật.
              </p>
            </div>

            <div className="space-y-6">
              {/* Current password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="current-password"
                  className="block text-sm text-gray-500 dark:text-slate-400"
                >
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    id="current-password"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-base placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="new-password"
                  className="block text-sm text-gray-500 dark:text-slate-400"
                >
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ít nhất 6 ký tự"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-base placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm text-gray-500 dark:text-slate-400"
                >
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full px-0 py-3 pr-10 bg-transparent text-foreground text-base placeholder:text-muted-foreground/60 border-0 border-b border-border dark:border-slate-600 focus:border-primary focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error / Success messages */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2"
                >
                  {success}
                </motion.p>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center min-h-[48px] py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Trở về
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 min-h-[48px] py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Lưu mật khẩu'
                  )}
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
