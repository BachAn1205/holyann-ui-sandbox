"use client";

import { MapPin, Phone, Mail } from "lucide-react";

export default function ContactSection() {
  return (
    <address className="space-y-3 not-italic" aria-label="Thông tin liên hệ">
      <div className="flex items-start gap-3 rounded-xl border border-sky-200/50 dark:border-sky-800/30 bg-sky-500/5 px-4 py-3">
        <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground m-0">Địa chỉ</p>
          <p className="text-sm text-muted-foreground m-0 mt-0.5">
            Tầng 12, Tòa nhà TechHub, 11 Duy Tân, Cầu Giấy, HN
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-sky-200/50 dark:border-sky-800/30 bg-sky-500/5 px-4 py-3">
        <Phone className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground m-0">Hotline</p>
          <p className="text-sm text-muted-foreground m-0 mt-0.5">
            <a href="tel:1900123456" className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              1900 123 456
            </a>
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-sky-200/50 dark:border-sky-800/30 bg-sky-500/5 px-4 py-3">
        <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-foreground m-0">Email</p>
          <p className="text-sm text-muted-foreground m-0 mt-0.5">
            <a href="mailto:support@holyann.vn" className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
              support@holyann.vn
            </a>
          </p>
        </div>
      </div>
    </address>
  );
}
