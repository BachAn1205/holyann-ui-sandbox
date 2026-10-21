"use client";

import React, { useState } from "react";
import { FileText, Image as ImageIcon, Link as LinkIcon, User, GraduationCap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StudentInfoContent } from "./StudentInfoContent";
import { TeacherInfoContent } from "./TeacherInfoContent";
import { SharedFiles } from "./SharedFiles";
import { SharedImages } from "./SharedImages";
import { SharedLinks } from "./SharedLinks";
import type { Mentor } from "../types";

export type InfoTabId = "info" | "files" | "images" | "links";

interface InfoTabsProps {
  partner: Mentor;
  partnerRole: "student" | "teacher";
  roomId: string;
  isPanelOpen: boolean;
}

export const InfoTabs: React.FC<InfoTabsProps> = ({
  partner,
  partnerRole,
  roomId,
  isPanelOpen,
}) => {
  const [activeTab, setActiveTab] = useState<InfoTabId>("info");

  const tabs: { id: InfoTabId; label: string; icon: React.ElementType }[] = [
    {
      id: "info",
      label: partnerRole === "student" ? "Học viên" : "Cố vấn",
      icon: partnerRole === "student" ? GraduationCap : User,
    },
    { id: "files", label: "Files", icon: FileText },
    { id: "images", label: "Ảnh", icon: ImageIcon },
    { id: "links", label: "Links", icon: LinkIcon },
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as InfoTabId)}
      className="flex flex-col h-full min-h-0"
    >
      <TabsList className="w-full grid shrink-0" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center justify-center gap-1.5 text-xs"
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mt-3">
        <TabsContent value="info" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          {partnerRole === "student" ? (
            <StudentInfoContent
              partnerId={partner.id}
              partner={partner}
              isActive={activeTab === "info" && isPanelOpen}
            />
          ) : (
            <TeacherInfoContent
              partnerId={partner.id}
              partner={partner}
              isActive={activeTab === "info" && isPanelOpen}
            />
          )}
        </TabsContent>
        <TabsContent value="files" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          <SharedFiles
            roomId={roomId}
            isActive={activeTab === "files" && isPanelOpen}
          />
        </TabsContent>
        <TabsContent value="images" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          <SharedImages
            roomId={roomId}
            isActive={activeTab === "images" && isPanelOpen}
          />
        </TabsContent>
        <TabsContent value="links" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden">
          <SharedLinks
            roomId={roomId}
            isActive={activeTab === "links" && isPanelOpen}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};
