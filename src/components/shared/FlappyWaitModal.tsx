"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Gamepad2, MousePointerClick, Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlappyHollies } from "@/components/games/FlappyHollies";

const easeOut = [0.16, 1, 0.3, 1] as const;

export function FlappyWaitModal({
  open,
  onOpenChange,
  title,
  subtitle,
  hideLabel = "Ẩn (vẫn đang xử lý)",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  hideLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 pt-0 sm:pt-0 gap-0 sm:max-w-4xl overflow-hidden">
        <DialogHeader className="space-y-0 p-0">
          <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-[#0052FF]/8 via-transparent to-[#4D7CFF]/8">
            <DialogTitle className="text-xl sm:text-2xl font-heading tracking-tight">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription asChild>
            <motion.div
              className="px-6 py-5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
                <div className="lg:col-span-2">
                  <div className="h-full rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-4 sm:p-5 shadow-sm text-left">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-[#0052FF]/10 text-[#0052FF]">
                        <Sparkles className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          Đang xử lý…
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {subtitle ?? (
                            <>
                              Chơi{" "}
                              <span className="font-semibold text-foreground">
                                Flappy Hollies
                              </span>{" "}
                              trong lúc đợi nhé.
                            </>
                          )}
                        </p>
                      </div>
                      <Loader2 className="size-4 mt-1.5 animate-spin text-muted-foreground" />
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="rounded-xl border border-border bg-muted/15 p-3">
                        <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Gamepad2 className="size-4 text-[#0052FF]" />
                          Điều khiển nhanh
                        </p>
                        <ul className="space-y-2 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <MousePointerClick className="size-4 mt-0.5 shrink-0" />
                            <span>
                              <span className="font-semibold text-foreground">
                                Click/Touch
                              </span>{" "}
                              để bay
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Keyboard className="size-4 mt-0.5 shrink-0" />
                            <span>
                              <span className="font-semibold text-foreground">
                                Space
                              </span>{" "}
                              để bay, và{" "}
                              <span className="font-semibold text-foreground">
                                Space/Click
                              </span>{" "}
                              lần nữa để chơi lại khi thua
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/10 p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Bạn có thể bấm{" "}
                          <span className="font-semibold text-foreground">
                            Ẩn
                          </span>{" "}
                          để đóng modal. Xử lý vẫn tiếp tục ở nền.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <motion.div
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.2, ease: easeOut }}
                    className="h-full rounded-3xl border border-[#0052FF]/15 bg-gradient-to-br from-[#0052FF]/8 via-background to-[#4D7CFF]/8 p-3 sm:p-4 shadow-[0_18px_45px_rgba(0,82,255,0.12)]"
                  >
                    <div className="flex items-center justify-between px-1.5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/70 dark:bg-background/70 border border-border shadow-sm">
                          <Gamepad2 className="size-4 text-[#0052FF]" />
                        </span>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold text-foreground">
                            Flappy Hollies
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Nhân vật: Holie
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white/55 dark:bg-card/60 border border-border shadow-sm p-2 sm:p-3">
                      <FlappyHollies height={340} spriteSrc="/holy/14.png" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="px-6 py-4 border-t border-border bg-background">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            {hideLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

