"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChecklistFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  sortBy: "due" | "priority" | "title";
  onSortChange: (value: "due" | "priority" | "title") => void;
  subjectOptions: string[];
}

export function ChecklistFilters({
  searchQuery,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  sortBy,
  onSortChange,
  subjectOptions,
}: ChecklistFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm task..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 rounded-xl border-border bg-background text-foreground"
        />
      </div>
      <Select value={subjectFilter ? subjectFilter : "all"} onValueChange={(v) => onSubjectFilterChange(v === "all" ? "" : v)}>
        <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl text-foreground">
          <SelectValue placeholder="Môn / Giai đoạn" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          {subjectOptions.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortBy} onValueChange={(v) => onSortChange(v as "due" | "priority" | "title")}>
        <SelectTrigger className="w-full sm:w-[160px] h-10 rounded-xl text-foreground">
          <SelectValue placeholder="Sắp xếp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="due">Theo hạn chót</SelectItem>
          <SelectItem value="priority">Theo độ ưu tiên</SelectItem>
          <SelectItem value="title">Theo tên</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
