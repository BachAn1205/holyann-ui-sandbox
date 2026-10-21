"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap, School } from "lucide-react";
import { FacultyWishlistCard } from "./FacultyWishlistCard";
import { SchoolWishlistCard } from "./SchoolWishlistCard";

interface ProfileWishlistSectionProps {
  studentId: string | null;
  /** Cả hai thẻ wishlist đã fetch xong — dùng để tải tài liệu đính kèm sau. */
  onWishlistsHydrated?: () => void;
  /**
   * When true, render two sibling `lg:col-span-4` panels for a parent 12-col grid
   * (Personal | Faculty | School).
   */
  bento?: boolean;
}

const FACULTY_MANAGE = "/student/universities?tab=faculty";
const SCHOOL_MANAGE = "/student/universities";

export const ProfileWishlistSection: React.FC<ProfileWishlistSectionProps> = ({
  studentId,
  onWishlistsHydrated,
  bento = false,
}) => {
  const [facultyDone, setFacultyDone] = useState(false);
  const [schoolDone, setSchoolDone] = useState(false);
  const hydratedRef = useRef(false);

  const onFacultyLoadComplete = useCallback(() => setFacultyDone(true), []);
  const onSchoolLoadComplete = useCallback(() => setSchoolDone(true), []);

  useEffect(() => {
    hydratedRef.current = false;
    setFacultyDone(false);
    setSchoolDone(false);
  }, [studentId]);

  useEffect(() => {
    if (!studentId || !facultyDone || !schoolDone || hydratedRef.current)
      return;
    hydratedRef.current = true;
    onWishlistsHydrated?.();
  }, [studentId, facultyDone, schoolDone, onWishlistsHydrated]);

  if (!studentId) return null;

  const panelClass = "pc-panel flex min-w-0 flex-col";

  const facultyPanel = (
    <section
      aria-labelledby="profile-faculty-wishlist-heading"
      className={`${panelClass}${bento ? " lg:col-span-4" : ""}`}
    >
      <div className="pc-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          <h2
            id="profile-faculty-wishlist-heading"
            className="pc-display truncate text-base text-foreground sm:text-lg"
          >
            Nguyện vọng ngành
          </h2>
        </div>
        <Link
          href={FACULTY_MANAGE}
          className="shrink-0 text-sm font-medium text-[#0f4c81] hover:underline dark:text-sky-300"
        >
          Chỉnh sửa
        </Link>
      </div>
      <div className="min-w-0 flex-1 px-4 py-3 sm:px-5 sm:py-4">
        <FacultyWishlistCard
          studentId={studentId}
          readOnly
          embedded
          manageHref={FACULTY_MANAGE}
          onLoadComplete={onFacultyLoadComplete}
        />
      </div>
    </section>
  );

  const schoolPanel = (
    <section
      aria-labelledby="profile-school-wishlist-heading"
      className={`${panelClass}${bento ? " lg:col-span-4" : ""}`}
    >
      <div className="pc-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <School className="size-4" aria-hidden />
          </span>
          <h2
            id="profile-school-wishlist-heading"
            className="pc-display truncate text-base text-foreground sm:text-lg"
          >
            Nguyện vọng trường
          </h2>
        </div>
        <Link
          href={SCHOOL_MANAGE}
          className="shrink-0 text-sm font-medium text-[#0f4c81] hover:underline dark:text-sky-300"
        >
          Chỉnh sửa
        </Link>
      </div>
      <div className="min-w-0 flex-1 px-4 py-3 sm:px-5 sm:py-4">
        <SchoolWishlistCard
          studentId={studentId}
          embedded
          manageHref={SCHOOL_MANAGE}
          onLoadComplete={onSchoolLoadComplete}
        />
      </div>
    </section>
  );

  if (bento) {
    return (
      <>
        {facultyPanel}
        {schoolPanel}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
      {facultyPanel}
      {schoolPanel}
    </div>
  );
};
