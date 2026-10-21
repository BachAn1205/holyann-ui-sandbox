"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DashboardData } from "./types";

interface MarketingPostsCardProps {
  posts: NonNullable<DashboardData['marketingPosts']>;
}

export function MarketingPostsCard({ posts }: MarketingPostsCardProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-6"
    >
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card w-full flex flex-col">
        <CardHeader className="border-b border-border px-6 py-4 bg-muted/30 dark:bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <CardTitle className="font-heading text-base font-bold text-primary m-0">
                Tin tức nổi bật
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post, idx) => (
              <Link
                href={`/student/posts/${post.slug}`}
                key={post.id}
                title="Bấm để xem chi tiết"
              >
                <div
                  className="group flex flex-row h-full rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
                >
                  <div className="w-28 sm:w-32 aspect-[4/3] sm:aspect-video bg-muted/50 overflow-hidden relative flex-shrink-0">
                    {post.thumbnailUrl ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-semibold bg-gradient-to-br from-muted to-muted/50 text-[10px]">
                        {post.category || "HOLYANN"}
                      </div>
                    )}
                    {post.category && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded text-[8px] font-bold text-primary uppercase tracking-wider shadow-sm">
                        {post.category}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1 min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-4 sm:line-clamp-5 mt-auto leading-relaxed">
                      {post.excerpt || "Khám phá ngay thông tin chi tiết về chương trình từ Holyann."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
