"use client";
import React from "react";
import { Mail, Facebook, Instagram, ChevronRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTiktok } from "@fortawesome/free-brands-svg-icons";
import { BRAND_COLORS, NAV_LINKS } from "../../lib/data";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full relative py-12 px-4 md:px-10 mt-20 overflow-hidden">
      {/* Background grids matching Hero style but 40px for variety/spacing */}
      <div className="absolute inset-0 z-[-1] opacity-40 bg-[linear-gradient(to_right,#e0e0e0_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e0_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute left-0 bottom-0 z-[-2] h-[500px] w-[500px] opacity-20 bg-[radial-gradient(circle_at_center,#cce0ff_0%,transparent_70%)]" />

      {/* Glass Panel Wrapper */}
      <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-xl border border-white/40 p-8 md:p-14 rounded-[3rem] shadow-2xl shadow-blue-100/30 relative z-[1]">
        <div className="grid gap-12 lg:grid-cols-12 items-start">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logos/Logo_Holyann_ngang-removebg-preview.png"
                alt="Holyann Explore"
                width={500}
                height={133}
                className="w-auto h-[120px] md:h-[140px] object-contain -ml-2"
                priority
              />
            </div>

            <p className="text-slate-700 font-medium text-base leading-relaxed max-w-md">
              <span className="text-blue-600 font-bold">Future by Design</span> - Vẽ đường tương lai, định hình ngày mai
            </p>
            <p className="mt-3 text-slate-600 text-sm leading-relaxed max-w-md">
              Chúng tôi tận tâm đồng hành cùng thế hệ trẻ Việt Nam trên hành trình chinh phục những học bổng danh giá trên toàn cầu.
            </p>
          </div>

          {/* Cột 2: Liên hệ nhanh */}
          <div className="lg:col-span-4">
            <h4 className="text-slate-900 font-extrabold mb-10 uppercase tracking-[0.2em] text-base">
              Thông Tin Liên Hệ
            </h4>
            <ul className="space-y-5">
              {[
                {
                  icon: <Mail size={18} />,
                  text: "holyann.contact@gmail.com",
                  href: "mailto:holyann.contact@gmail.com",
                  hoverClass: "group-hover:bg-red-500 group-hover:border-red-400 text-slate-600 group-hover:text-white",
                },
                {
                  icon: <Facebook size={18} />,
                  text: "Holyann Explore",
                  href: "https://www.facebook.com/holyannxplore",
                  hoverClass: "group-hover:bg-blue-600 group-hover:border-blue-500 text-slate-600 group-hover:text-white",
                },
                {
                  icon: <Instagram size={18} />,
                  text: "@holyannexplore",
                  href: "https://www.instagram.com/holyannexplore/",
                  hoverClass: "group-hover:bg-gradient-to-tr group-hover:from-yellow-500 group-hover:via-red-500 group-hover:to-purple-500 group-hover:border-transparent text-slate-600 group-hover:text-white",
                },
                {
                  icon: <FontAwesomeIcon icon={faTiktok} />,
                  text: "@holyannexplore",
                  href: "https://www.tiktok.com/@holyannexplore",
                  hoverClass: "group-hover:bg-black group-hover:border-slate-800 text-slate-600 group-hover:text-white",
                },
              ].map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 text-slate-700 font-semibold hover:text-blue-600 transition-colors"
                  >
                    <span className={`w-11 h-11 rounded-2xl bg-white border border-slate-100 flex shrink-0 items-center justify-center shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md ${item.hoverClass}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm tracking-wide">
                      {item.text}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Liên kết nhanh */}
          <div className="lg:col-span-3">
            <h4 className="text-slate-900 font-extrabold mb-11 uppercase tracking-[0.2em] text-base">
              Khám Phá
            </h4>
            <ul className="grid grid-cols-1 gap-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition-all font-bold"
                  >
                    <ChevronRight
                      size={14}
                      className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all"
                    />
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="mt-16 pt-8 border-t border-slate-200/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[11px] tracking-wider text-slate-500 font-bold uppercase">
              © 2025 <span className="text-slate-800">Holyann Explore</span>.
              All Rights Reserved.
            </div>

            <div className="flex items-center gap-8">
              <p className="text-[10px] text-slate-500 font-semibold italic">
                Crafted with passion for future leaders
              </p>
              <div className="h-4 w-[1px] bg-slate-200 hidden md:block"></div>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="text-[10px] uppercase tracking-widest text-blue-600 font-black hover:text-blue-800 transition-colors"
              >
                Back to top ↑
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

