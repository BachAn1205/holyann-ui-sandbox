"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="h-32 rounded-2xl bg-muted/50" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-5 w-32 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[240px] rounded-lg bg-muted/50" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-5 w-40 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[240px] rounded-lg bg-muted/50" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-2">
            <div className="h-5 w-36 rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-[240px] rounded-lg bg-muted/50" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="h-5 w-40 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-48 rounded-lg bg-muted/50" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="h-5 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-32 rounded-lg bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
