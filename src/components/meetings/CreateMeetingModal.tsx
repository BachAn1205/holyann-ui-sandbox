"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  Loader2,
  ChevronDown,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  createConsultationEvent,
  getAssignedStudentsForMentor,
} from "@/actions/calendar";

// ============================================================
// TYPES
// ============================================================

interface AssignedStudent {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

// ============================================================
// VALIDATION SCHEMA
// ============================================================

const meetingFormSchema = z.object({
  content: z.string().min(1, "Vui lòng nhập nội dung cuộc họp"),
  studentId: z.string().min(1, "Vui lòng chọn học viên"),
  startDate: z.date(),
  startTime: z.string().min(1, "Vui lòng chọn giờ bắt đầu"),
  duration: z.string().min(1, "Vui lòng chọn thời lượng"),
});

type MeetingFormValues = z.infer<typeof meetingFormSchema>;

// ============================================================
// COMPONENT
// ============================================================

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorEmail: string;
  /** Pre-select a specific student when opening from chat (optional) */
  prefilledStudentId?: string;
  /** Called with full result data after meeting is created */
  onMeetingCreated?: (result: {
    meetingId?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    meetLink?: string | null;
    hostMeetLink?: string | null;
    studentId?: string;
  }) => void;
}

export default function CreateMeetingModal({
  open,
  onOpenChange,
  mentorEmail,
  prefilledStudentId,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      content: "",
      studentId: "",
      startDate: new Date(),
      startTime: "09:00",
      duration: "60",
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

  const watchStartDate = watch("startDate");
  const watchDuration = watch("duration");
  const watchStudentId = watch("studentId");

  // Lấy thông tin student được chọn
  const selectedStudent = students.find((s) => s.id === watchStudentId);

  // Fetch student list when modal opens, then pre-fill if needed
  useEffect(() => {
    if (open) {
      setIsLoadingStudents(true);
      getAssignedStudentsForMentor()
        .then((result) => {
          if (result.success && result.data) {
            setStudents(result.data as AssignedStudent[]);
            // Auto-select pre-filled student
            if (prefilledStudentId) {
              setValue("studentId", prefilledStudentId);
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching students:", err);
        })
        .finally(() => {
          setIsLoadingStudents(false);
        });
    }
  }, [open, prefilledStudentId, setValue]);

  // Lọc danh sách học viên theo search
  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (data: MeetingFormValues) => {
    setIsSubmitting(true);

    try {
      const startDateTime = new Date(data.startDate);
      const [startH, startM] = data.startTime.split(":").map(Number);
      startDateTime.setHours(startH, startM, 0, 0);

      if (startDateTime < new Date()) {
        toast.error("Không hợp lệ", {
          description: "Không thể đặt lịch trong quá khứ",
        });
        setIsSubmitting(false);
        return;
      }

      const durationMinutes = Number(data.duration);

      const result = await createConsultationEvent({
        content: data.content,
        startTime: startDateTime,
        durationMinutes: durationMinutes,
        mentorEmail: mentorEmail,
        studentId: data.studentId,
      });

      if (result.success) {
        toast.success("Đã tạo lịch tư vấn thành công!", {
          description: result.meetLink
            ? `Link phòng họp: ${result.meetLink}`
            : "Lịch đã được tạo.",
        });
        reset();
        onOpenChange(false);
        // Pass full result to caller so chat can display meeting bubble
        onMeetingCreated?.({
          meetingId: result.meetingId,
          title: result.title,
          startTime: result.startTime,
          endTime: result.endTime,
          meetLink: result.meetLink ?? null,
          hostMeetLink: result.hostMeetLink ?? null,
          studentId: result.studentId,
        });
      } else {
        toast.error("Không thể tạo lịch", {
          description: result.error || "Đã xảy ra lỗi",
        });
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Lỗi không xác định", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Thêm buổi tư vấn mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Content Input */}
          <div className="space-y-2">
            <Input
              {...register("content")}
              placeholder="Nội dung buổi tư vấn"
              className="border-0 border-b-2 border-muted-foreground/30 bg-transparent px-0 text-lg font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:ring-0 focus-visible:ring-0"
            />
            {errors.content && (
              <p className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Date & Time Picker */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !watchStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchStartDate ? (
                        format(watchStartDate, "dd/MM/yyyy", { locale: vi })
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={watchStartDate}
                      onSelect={(date) => date && setValue("startDate", date)}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  type="time"
                  {...register("startTime")}
                  className="w-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Duration Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Thời lượng:
            </label>
            <input type="hidden" {...register("duration")} />
            <div className="flex flex-wrap gap-2">
              {[
                { value: "30", label: "30 phút" },
                { value: "60", label: "1 giờ" },
                { value: "90", label: "1.5 giờ" },
                { value: "120", label: "2 giờ" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={watchDuration === opt.value ? "default" : "outline"}
                  onClick={() => setValue("duration", opt.value)}
                  className="rounded-full px-4"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {errors.duration && (
              <p className="text-sm text-destructive">
                {errors.duration.message}
              </p>
            )}
          </div>

          {/* Student Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Chọn học viên:
              </span>
            </div>
            <input type="hidden" {...register("studentId")} />
            <Popover
              open={studentDropdownOpen}
              onOpenChange={setStudentDropdownOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={studentDropdownOpen}
                  className="w-full justify-between font-normal"
                >
                  {isLoadingStudents ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </span>
                  ) : selectedStudent ? (
                    <span className="flex items-center gap-2 truncate">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {selectedStudent.full_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">
                        {selectedStudent.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        ({selectedStudent.email})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Chọn học viên...
                    </span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="flex items-center border-b px-3 py-2">
                  <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Tìm học viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {filteredStudents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {students.length === 0
                        ? "Chưa có học viên nào được phân công"
                        : "Không tìm thấy học viên"}
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                          watchStudentId === student.id &&
                            "bg-primary/10 text-primary"
                        )}
                        onClick={() => {
                          setValue("studentId", student.id);
                          setStudentDropdownOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {student.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.email}
                          </p>
                        </div>
                        {watchStudentId === student.id && (
                          <span className="text-primary text-xs font-medium">
                            ✓
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {errors.studentId && (
              <p className="text-sm text-destructive">
                {errors.studentId.message}
              </p>
            )}
          </div>

          {/* Info Note */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-800 dark:text-blue-300">
            <Video className="inline h-4 w-4 mr-1" />
            Link phòng họp sẽ tự động được tạo và gửi qua email cho học viên và
            mentor
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
