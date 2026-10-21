"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import type { DashboardDeadline } from "./types";

interface CalendarWidgetProps {
  deadlines: DashboardDeadline[];
}

export function CalendarWidget({ deadlines }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  // Helper to check if a day has events
  const getEventsForDay = (day: number) => {
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return deadlines.filter(d => {
      const dDate = new Date(d.dueDate);
      const dStr = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(dDate.getDate()).padStart(2, '0')}`;
      return dStr === targetDateStr && !d.completed;
    });
  };

  const today = new Date();
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const renderCells = () => {
    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8 w-8 sm:h-10 sm:w-10"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const events = getEventsForDay(i);
      const hasDeadline = events.some(e => e.subject !== "Mentor" && e.subject !== "Meeting");
      const hasMeeting = events.some(e => e.subject === "Mentor" || e.subject === "Meeting");
      
      cells.push(
        <div 
          key={i} 
          className={`h-8 w-8 sm:h-10 sm:w-10 flex flex-col items-center justify-center rounded-lg relative cursor-pointer transition-colors ${
            isToday(i) ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <span className="text-sm">{i}</span>
          <div className="flex gap-1 absolute bottom-1">
            {hasDeadline && <div className={`w-1.5 h-1.5 rounded-full ${isToday(i) ? 'bg-white' : 'bg-rose-500'}`} />}
            {hasMeeting && <div className={`w-1.5 h-1.5 rounded-full ${isToday(i) ? 'bg-blue-200' : 'bg-blue-500'}`} />}
          </div>
        </div>
      );
    }
    return cells;
  };

  // Lấy các sự kiện sắp tới nhất (top 3) để hiển thị list bên dưới
  const upcomingEvents = [...deadlines]
    .filter(d => !d.completed && new Date(d.dueDate) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
      <div className="p-4 sm:p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Lịch trình & Hạn nộp
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-bold w-20 text-center">{monthNames[month]}</span>
            <button onClick={nextMonth} className="p-1 rounded-md hover:bg-slate-100 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-xs font-semibold text-slate-400 py-1">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {renderCells()}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs font-medium text-slate-500">Hạn nộp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-medium text-slate-500">Tư vấn / Mentor</span>
          </div>
        </div>
      </div>

      {/* Upcoming List */}
      <div className="p-4 sm:p-5 bg-slate-50/50">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sắp diễn ra</h4>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-2">Không có lịch trình sắp tới.</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => {
              const date = new Date(event.dueDate);
              const isMeeting = event.subject === "Mentor" || event.subject === "Meeting";
              return (
                <div key={event.id} className="flex gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 ${isMeeting ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    <span className="text-[10px] font-bold uppercase">{monthNames[date.getMonth()].replace('Tháng ', 'T')}</span>
                    <span className="text-sm font-black">{date.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate" title={event.title}>{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isMeeting ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {event.subject}
                      </span>
                      <span className="text-[10px] flex items-center gap-1 text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
