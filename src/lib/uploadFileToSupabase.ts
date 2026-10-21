// Mock uploadFileToSupabase: Trả về URL giả lập sau 1s
export async function uploadFileToSupabase(file: File): Promise<string> {
  // TODO: Thay thế bằng logic upload thực tế lên Supabase Storage
  await new Promise((res) => setTimeout(res, 1000));
  return "https://dummyimage.com/600x400/000/fff&text=Uploaded";
}
