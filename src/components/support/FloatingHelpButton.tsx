"use client";

import React, { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Upload, X } from "lucide-react";
import { submitSupportRequest, uploadSupportImage } from "@/actions/support";
import { toast } from "sonner";

const supportSchema = z.object({
  description: z.string().min(1, "Mô tả không được để trống"),
  image: z.any().optional(),
});

type SupportFormValues = z.infer<typeof supportSchema>;

export function FloatingHelpButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname?.includes("/chat");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { description: "", image: undefined },
  });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file, { shouldValidate: true });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setValue("image", undefined);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: SupportFormValues) => {
    setUploading(true);
    let imageUrl: string | null = null;
    try {
      // 1. Upload ảnh nếu có (qua server action, bypass RLS)
      if (values.image instanceof File) {
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(values.image.type)) {
          toast.error("Chỉ hỗ trợ file PNG, JPG, WEBP");
          setUploading(false);
          return;
        }
        if (values.image.size > 5 * 1024 * 1024) {
          toast.error("File vượt quá 5MB");
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", values.image);
        const uploadRes = await uploadSupportImage(formData);

        if (!uploadRes.success || !uploadRes.url) {
          toast.error(uploadRes.error || "Upload ảnh thất bại");
          setUploading(false);
          return;
        }
        imageUrl = uploadRes.url;
      }

      // 2. Gửi yêu cầu hỗ trợ với URL ảnh thật (hoặc null)
      const res = await submitSupportRequest({
        description: values.description,
        imageUrl,
      });

      if (res.success) {
        toast.success("Gửi yêu cầu thành công!");
        reset();
        setImagePreview(null);
        setOpen(false);
      } else {
        toast.error(res.error || "Gửi yêu cầu thất bại");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={`fixed right-6 rounded-full p-0 w-14 h-14 bg-primary text-white shadow-lg hover:bg-primary/90 z-50 transition-all duration-300 ${
            isChatPage ? "bottom-24" : "bottom-6"
          }`}
          aria-label="Gửi yêu cầu trợ giúp"
        >
          <HelpCircle className="w-7 h-7" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 rounded-xl shadow-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <span className="font-semibold text-lg">Gửi yêu cầu trợ giúp</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => setOpen(false)}
              tabIndex={-1}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          {/* Upload Area */}
            {/* Upload Area */}
            <div className="px-5 pt-5">
                <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 mb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700/80 transition-colors duration-200"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-24 h-24 object-cover rounded-md border border-border"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-1"
                                onClick={e => {
                                    e.stopPropagation();
                                    removeImage();
                                }}
                            >
                                Xóa ảnh
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-primary" />
                            <span className="text-sm font-medium text-primary">Tải lên ảnh chụp vấn đề</span>
                            <span className="text-xs text-muted-foreground">Định dạng file png, jpg, tối đa 5MB</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={onSelectFile}
                        tabIndex={-1}
                    />
                </div>
            </div>
          {/* Textarea */}
          <div className="px-5 pb-2">
            <label className="block mb-1 font-medium text-sm">
              Mô tả chi tiết vấn đề <span className="text-red-500">*</span>
            </label>
            <Textarea
              {...register("description")}
              placeholder="Nhập mô tả chi tiết tại đây ..."
              className="resize-none min-h-[90px]"
              maxLength={5000}
              disabled={uploading || isSubmitting}
            />
            {errors.description && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.description.message}
              </span>
            )}
          </div>
          {/* Footer */}
          <div className="flex justify-end px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-b-xl">
            <Button
              type="submit"
              className="bg-primary text-white hover:bg-primary/90 min-w-[120px]"
              disabled={isSubmitting || uploading}
            >
              {uploading ? "Đang tải ảnh..." : isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export default FloatingHelpButton;
