'use client';
import { MentorFloatingActionMenu } from '@/components/support/MentorFloatingActionMenu';

export default function TestDrag() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1>Test Drag Page</h1>
      <p>Try dragging the menu below.</p>
      <MentorFloatingActionMenu />
    </div>
  );
}
