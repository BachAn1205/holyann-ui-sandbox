import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <div className="text-center max-w-md mx-auto space-y-6">
        <p className="text-6xl sm:text-8xl font-bold text-primary/20 select-none">
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
          Không tìm thấy trang
        </h1>
        <p className="text-sm text-muted-foreground">
          Trang bạn truy cập không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm
          tra lại đường dẫn hoặc quay về trang chủ.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
