"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { StudentProfile } from "../../types"; // Hãy đảm bảo đường dẫn này đúng với dự án của bạn

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: StudentProfile;
  onSave: (updatedProfile: StudentProfile) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [formData, setFormData] = useState<StudentProfile>(currentProfile);

  // Sync state when profile changes
  useEffect(() => {
    setFormData(currentProfile);
  }, [currentProfile]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAchievementChange = (index: number, value: string) => {
    const newAchievements = [...formData.achievements];
    newAchievements[index] = value;
    setFormData((prev) => ({ ...prev, achievements: newAchievements }));
  };

  const addAchievement = () => {
    setFormData((prev) => ({
      ...prev,
      achievements: [...prev.achievements, ""],
    }));
  };

  const removeAchievement = (index: number) => {
    const newAchievements = formData.achievements.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, achievements: newAchievements }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative inline-block align-middle rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-2xl w-full mx-4 bg-card text-foreground border border-border">
        <div className="px-4 py-3 sm:px-6 flex justify-between items-center bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <h3
            className="text-lg leading-6 font-medium"
            id="modal-title"
          >
            Cập nhật hồ sơ du học
          </h3>
          <button
            onClick={onClose}
            className="text-primary-foreground/70 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* Personal Information Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Thông tin cá nhân
              </h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="dob"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Ngày sinh
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      name="dob"
                      id="dob"
                      required
                      value={formData.dob}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground rounded-md p-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4"></div>

            {/* Academic Stats Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Thông tin học thuật
              </h4>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="gpa"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    GPA (Thang 4.0)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="gpa"
                      id="gpa"
                      step="0.01"
                      max="4.0"
                      required
                      value={formData.gpa}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground rounded-md p-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="englishLevel"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Trình độ Ngoại ngữ
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="englishLevel"
                      id="englishLevel"
                      placeholder="VD: IELTS 7.5, TOEFL 100..."
                      required
                      value={formData.englishLevel}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground placeholder-muted-foreground rounded-md p-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="satScore"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Điểm SAT (Nếu có)
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="satScore"
                      id="satScore"
                      value={formData.satScore || ""}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground rounded-md p-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="targetMajor"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Ngành học dự kiến
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="targetMajor"
                      id="targetMajor"
                      value={formData.targetMajor}
                      onChange={handleChange}
                      className="shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground rounded-md p-2 border"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4"></div>

            {/* Achievements Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Thành tích nổi bật
                </h4>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none"
                >
                  <Plus size={14} className="mr-1" /> Thêm
                </button>
              </div>

              <div className="space-y-3">
                {formData.achievements.map((ach, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={typeof ach === "string" ? ach : ach.text}
                      onChange={(e) =>
                        handleAchievementChange(index, e.target.value)
                      }
                      placeholder="VD: Giải Nhất học sinh giỏi..."
                      className="flex-1 shadow-sm focus:ring-[var(--brand-blue)] focus:border-[var(--brand-blue)] block w-full sm:text-sm border-border bg-background text-foreground placeholder-muted-foreground rounded-md p-2 border"
                    />
                    <button
                      type="button"
                      onClick={() => removeAchievement(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-500 text-base font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Lưu hồ sơ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
