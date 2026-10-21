import * as React from "react";
import { MeetingEmail } from "./MeetingEmail";

export default function MeetingEmailPreview() {
  return (
    <MeetingEmail
      variant="invite"
      title="Buoi tu van ho so"
      description="Chung ta se trao doi ve dinh huong nganh hoc va ke hoach ho so."
      startTime={new Date("2026-03-30T19:30:00+07:00")}
      endTime={new Date("2026-03-30T20:30:00+07:00")}
      mentorName="Co Lan"
      meetLink="https://meet.google.com/abc-defg-hij"
    />
  );
}
