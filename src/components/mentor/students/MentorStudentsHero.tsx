"use client";

export default function MentorStudentsHero() {
  return (
    <section
      aria-label="Quản lý học viên"
      className="relative mb-6 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-(--brand-cyan)/20 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-5xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-sm font-medium tracking-tight text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Khu vực cố vấn
          </p>
          <h1 className="mt-3 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Danh sách học viên
          </h1>
          <p className="mt-3 max-w-3xl text-base text-white/95 sm:text-lg">
            Theo dõi tiến độ từng học viên, ưu tiên hỗ trợ đúng người đúng thời điểm và truy cập nhanh hồ sơ chi tiết.
          </p>
        </div>
      </div>
    </section>
  );
}

