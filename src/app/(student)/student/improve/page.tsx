import { redirect } from "next/navigation";

/** Đường dẫn cũ — chuyển sang trang cải thiện luận (feature 4). */
export default function ImproveRedirectPage() {
  redirect("/student/essay-improve");
}
