"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createConsultationEvent } from "@/actions/calendar";

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const reminderFormSchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung nhắc hẹn"),
  studentEmail: z
    .string()
    .min(1, "Vui lòng nhập email học viên")
    .email("Email không hợp lệ"),
  duration: z.string().min(1, "Vui lòng chọn thời lượng"),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

// ============================================================
// COMPONENT
// ============================================================

interface CreateReminderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorEmail: string;
}

export default function CreateReminderModal({
  open,
  onOpenChange,
  mentorEmail,
}: CreateReminderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [activeQuickSelect, setActiveQuickSelect] = useState<string | null>(null);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      content: "",
      studentEmail: "",
      duration: "60", // Mặc định 60 phút (1 giờ)
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const watchDuration = watch("duration");

  // ============================================================
  // QUICK SELECT HANDLERS
  // ============================================================

  const handleQuickSelect = (type: string) => {
    setActiveQuickSelect(type);
    const now = new Date();

    switch (type) {
      case "15min":
        const in15min = addMinutes(now, 15);
        setSelectedDate(in15min);
        setSelectedTime(`${String(in15min.getHours()).padStart(2, "0")}:${String(in15min.getMinutes()).padStart(2, "0")}`);
        break;
      case "30min":
        const in30min = addMinutes(now, 30);
        setSelectedDate(in30min);
        setSelectedTime(`${String(in30min.getHours()).padStart(2, "0")}:${String(in30min.getMinutes()).padStart(2, "0")}`);
        break;
      case "tomorrow9am":
        const tomorrow = addDays(now, 1);
        setSelectedDate(tomorrow);
        setSelectedTime("09:00");
        break;
      case "custom":
        // User sẽ chọn thủ công
        break;
    }
  };

  // ============================================================
  // SUBMIT HANDLER
  // ============================================================

  const onSubmit = async (data: ReminderFormValues) => {
    setIsSubmitting(true);

    try {
      // Debug: Log toàn bộ data từ form
      console.log("[CreateReminderModal] Form data:", data);
      console.log("[CreateReminderModal] duration:", data.duration);

      // Combine selectedDate với selectedTime
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(hours, minutes, 0, 0);

      // Parse duration thành number
      const durationMinutes = Number(data.duration);

      const result = await createConsultationEvent({
        content: data.content,
        startTime: startDateTime,
        durationMinutes: durationMinutes,
        mentorEmail: mentorEmail,
        studentId: data.studentEmail,
      });

      if (result.success) {
        toast.success("Đã tạo nhắc hẹn thành công!", {
          description: result.meetLink
            ? `Link phòng họp: ${result.meetLink}`
            : "Email đã được gửi cho học viên.",
        });
        reset();
        setSelectedDate(new Date());
        setSelectedTime("09:00");
        setActiveQuickSelect(null);
        onOpenChange(false);
      } else {
        toast.error("Không thể tạo nhắc hẹn", {
          description: result.error || "Đã xảy ra lỗi",
        });
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Lỗi không xác định", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background dark:bg-slate-900 p-6">
        <DialogHeader className="border-b dark:border-slate-700 pb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Tạo nhắc hẹn
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
          {/* Content Textarea */}
          <div className="space-y-2">
            <Textarea
              {...register("content")}
              placeholder="Nhập nội dung mới hoặc dán link"
              rows={4}
              className="resize-none rounded-xl border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Student Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email học viên <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("studentEmail")}
              placeholder="example@email.com"
              type="email"
              className="rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-foreground"
            />
            {errors.studentEmail && (
              <p className="text-sm text-destructive">
                {errors.studentEmail.message}
              </p>
            )}
          </div>

          {/* Quick Select Buttons */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Chọn thời gian
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeQuickSelect === "15min" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect("15min")}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                15 phút nữa
              </Button>
              <Button
                type="button"
                variant={activeQuickSelect === "30min" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect("30min")}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                30 phút nữa
              </Button>
              <Button
                type="button"
                variant={activeQuickSelect === "tomorrow9am" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect("tomorrow9am")}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                9:00 ngày mai
              </Button>
              <Button
                type="button"
                variant={activeQuickSelect === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect("custom")}
                className="rounded-full px-4 py-2 text-sm font-medium transition-all"
              >
                Khác
              </Button>
            </div>
          </div>

          {/* Date Time Picker with Calendar Popover */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* Date Picker with Calendar Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd/MM/yyyy", { locale: vi })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setActiveQuickSelect("custom");
                      }
                    }}
                    modifiers={{
                      selected: (day) => {
                        // Chỉ highlight ngày được chọn, không highlight ngày hiện tại
                        return (
                          day.getDate() === selectedDate.getDate() &&
                          day.getMonth() === selectedDate.getMonth() &&
                          day.getFullYear() === selectedDate.getFullYear()
                        );
                      },
                    }}
                    modifiersClassNames={{
                      selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Time Picker */}
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  setActiveQuickSelect("custom");
                }}
                className="w-[120px] rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-foreground dark:[color-scheme:dark]"
              />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              {format(selectedDate, "EEEE, dd 'tháng' MM, yyyy", { locale: vi })} lúc {selectedTime}
              {watchDuration && (
                <>
                  {" → "}
                  {(() => {
                    const [h, m] = selectedTime.split(":").map(Number);
                    const start = new Date(selectedDate);
                    start.setHours(h, m, 0, 0);
                    const end = addMinutes(start, Number(watchDuration));
                    const endHours = end.getHours();
                    const endMinutes = end.getMinutes();

                    // Logic AM/PM chuẩn:
                    // 0:00 - 11:59 -> AM (0 hiển thị là 12)
                    // 12:00 - 23:59 -> PM (13-23 hiển thị là 1-11)
                    const period = endHours < 12 ? "AM" : "PM";
                    const displayHours = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;

                    return `${displayHours}:${String(endMinutes).padStart(2, "0")} ${period}`;
                  })()}
                </>
              )}
            </p>
          </div>

          {/* Duration Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Thời lượng:
            </label>
            <input type="hidden" {...register("duration")} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={watchDuration === "30" ? "default" : "outline"}
                onClick={() => setValue("duration", "30")}
                className="rounded-full px-4"
              >
                30 phút
              </Button>
              <Button
                type="button"
                size="sm"
                variant={watchDuration === "60" ? "default" : "outline"}
                onClick={() => setValue("duration", "60")}
                className="rounded-full px-4"
              >
                1 giờ
              </Button>
              <Button
                type="button"
                size="sm"
                variant={watchDuration === "90" ? "default" : "outline"}
                onClick={() => setValue("duration", "90")}
                className="rounded-full px-4"
              >
                1.5 giờ
              </Button>
              <Button
                type="button"
                size="sm"
                variant={watchDuration === "120" ? "default" : "outline"}
                onClick={() => setValue("duration", "120")}
                className="rounded-full px-4"
              >
                2 giờ
              </Button>
            </div>
            {errors.duration && (
              <p className="text-sm text-destructive">{errors.duration.message}</p>
            )}
          </div>

          {/* Info Note */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3 text-sm text-blue-800 dark:text-blue-300">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Link phòng họp Jitsi tự động</p>
                <p className="text-xs mt-1 opacity-90">
                  Link phòng họp sẽ được tạo và gửi qua email cho học viên
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="border-t dark:border-slate-700 pt-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo nhắc hẹn"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
