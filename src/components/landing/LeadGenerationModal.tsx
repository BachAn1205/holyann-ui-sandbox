"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitLeadForm, type LeadFormInput } from "@/actions/lead";

// ==================== FORM SCHEMA ====================

const LeadModalSchema = z.object({
  // Step 1: Study Plan
  category: z.string().optional(),
  study_level: z.string().optional(),
  budget_per_year: z.string().optional(),
  intended_country: z.string().max(100).optional(),
  intended_major: z.string().max(255).optional(),
  intended_university: z.string().max(255).optional(),
  // Step 2: Contact Info
  full_name: z
    .string()
    .min(1, "Họ tên là bắt buộc")
    .max(100, "Họ tên không được quá 100 ký tự"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  current_school: z.string().min(1, "Trường đang học là bắt buộc").max(255),
  current_grade: z.string().min(1, "Lớp / Năm học là bắt buộc").max(50),
  current_location: z.string().min(1, "Nơi ở hiện tại là bắt buộc").max(255),
});

type LeadModalFormValues = z.infer<typeof LeadModalSchema>;

// ==================== OPTIONS ====================

const CATEGORY_OPTIONS = [
  { value: "consultation", label: "Đăng ký tư vấn" },
  { value: "package", label: "Đăng ký gói" },
];

const STUDY_LEVEL_OPTIONS = [
  { value: "high_school", label: "Trung học" },
  { value: "college", label: "Cao đẳng" },
  { value: "university", label: "Đại học" },
  { value: "master", label: "Thạc sỹ" },
  { value: "other", label: "Khác" },
];

const BUDGET_OPTIONS = [
  { value: "under_500m", label: "Dưới 500 triệu" },
  { value: "500m_1b", label: "500 triệu - 1 tỷ" },
  { value: "1b_2b", label: "1 tỷ - 2 tỷ" },
  { value: "over_2b", label: "Trên 2 tỷ" },
  { value: "undecided", label: "Chưa xác định" },
];

// ==================== COMPONENT ====================

interface LeadGenerationModalProps {
  triggerText?: string;
  triggerClassName?: string;
  triggerVariant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}

export function LeadGenerationModal({
  triggerText = "Đăng ký tư vấn ngay",
  triggerClassName = "",
  triggerVariant = "default",
}: LeadGenerationModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadModalFormValues>({
    resolver: zodResolver(LeadModalSchema),
    defaultValues: {
      category: "",
      study_level: "",
      budget_per_year: "",
      intended_country: "",
      intended_major: "",
      intended_university: "",
      full_name: "",
      phone: "",
      email: "",
      current_school: "",
      current_grade: "",
      current_location: "",
    },
  });

  // Handle next step (Step 1 -> Step 2)
  const handleNextStep = async () => {
    // Validate step 1 fields (optional fields, just move forward)
    setStep(2);
  };

  // Handle back step (Step 2 -> Step 1)
  const handleBackStep = () => {
    setStep(1);
  };

  // Handle form submit
  const onSubmit = async (data: LeadModalFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform data to match server action input
      const submitData: LeadFormInput = {
        full_name: data.full_name,
        phone: data.phone,
        email: data.email,
        current_location: data.current_location || null,
        current_school: data.current_school || null,
        current_grade: data.current_grade || null,
        category: data.category || null,
        study_level: data.study_level || null,
        intended_major: data.intended_major || null,
        intended_country: data.intended_country || null,
        intended_university: data.intended_university || null,
        budget_per_year: data.budget_per_year || null,
      };

      const result = await submitLeadForm(submitData);

      if (result.success) {
        toast.success("Đăng ký thành công!", {
          description: "Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
        });
        // Reset and close
        form.reset();
        setStep(1);
        setOpen(false);
      } else {
        // Handle validation errors from server
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            form.setError(field as keyof LeadModalFormValues, {
              type: "server",
              message: messages[0],
            });
          });
        }
        toast.error("Có lỗi xảy ra", {
          description: result.message || "Vui lòng kiểm tra lại thông tin.",
        });
      }
    } catch (error) {
      console.error("[LeadGenerationModal] Submit error:", error);
      toast.error("Lỗi hệ thống", {
        description: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form and step when closing
      setTimeout(() => {
        form.reset();
        setStep(1);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-primary mb-2">
            {step === 1
              ? "Kế hoạch du học của bạn thế nào?"
              : "Thông tin liên hệ"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <span className={step === 1 ? "text-primary font-semibold" : ""}>
              Bước 1
            </span>
            <span>/</span>
            <span className={step === 2 ? "text-primary font-semibold" : ""}>
              Bước 2
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ==================== STEP 1 ==================== */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục đăng ký" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Study Level */}
                <FormField
                  control={form.control}
                  name="study_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bậc học quan tâm</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn bậc học" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STUDY_LEVEL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Budget */}
                <FormField
                  control={form.control}
                  name="budget_per_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngân sách dự kiến / năm</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn ngân sách" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BUDGET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Intended Country */}
                <FormField
                  control={form.control}
                  name="intended_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quốc gia mục tiêu</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Mỹ, Úc, Canada, Anh..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Intended Major */}
                <FormField
                  control={form.control}
                  name="intended_major"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngành học quan tâm</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Kinh doanh, Công nghệ thông tin..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Intended University */}
                <FormField
                  control={form.control}
                  name="intended_university"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trường mục tiêu (nếu có)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Harvard, MIT, Stanford..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Next Button */}
                <Button
                  type="button"
                  className="w-full mt-6"
                  onClick={handleNextStep}
                >
                  Tiếp tục
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại
                </button>

                <p className="text-sm text-muted-foreground">
                  Để chúng tôi liên hệ tư vấn chi tiết cho bạn
                </p>

                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Họ và tên <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập họ và tên" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Số điện thoại{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: 0912345678"
                          type="tel"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Email <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email@example.com"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current School */}
                <FormField
                  control={form.control}
                  name="current_school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Trường đang học <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: THPT Chu Văn An" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Grade */}
                <FormField
                  control={form.control}
                  name="current_grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Lớp / Năm học <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Lớp 11, Năm 2..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Location */}
                <FormField
                  control={form.control}
                  name="current_location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="!text-current">
                        Nơi ở hiện tại (Tỉnh/Thành phố) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Hà Nội, TP.HCM..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Hoàn thành & Nhận tư vấn
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== EXPORT TRIGGER BUTTON ====================

export function LeadGenerationButton({
  children,
  className = "",
  variant = "default",
}: {
  children?: React.ReactNode;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
}) {
  return (
    <LeadGenerationModal
      triggerText={(children as string) || "Đăng ký tư vấn ngay"}
      triggerClassName={className}
      triggerVariant={variant}
    />
  );
}

export default LeadGenerationModal;
