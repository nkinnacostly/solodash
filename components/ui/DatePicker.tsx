"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD
  label?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  disabled = false,
  minDate,
  label,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value
  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowMonthPicker(false);
        setShowYearPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set initial month/year from value
  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [selectedDate]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { day: number; currentMonth: boolean; date: string }[] = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        day,
        currentMonth: false,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        day,
        currentMonth: true,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        day,
        currentMonth: false,
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const calendarDays = generateCalendarDays();

  // Check if date is before minDate
  const isDisabled = (dateStr: string) => {
    if (!minDate) return false;
    return dateStr < minDate;
  };

  // Check if date is today
  const isToday = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return dateStr === todayStr;
  };

  // Check if date is selected
  const isSelected = (dateStr: string) => {
    return dateStr === value;
  };

  // Handle day click
  const handleDayClick = (dateStr: string) => {
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
    setIsOpen(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Handle month selection
  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setShowMonthPicker(false);
  };

  // Handle year selection
  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    setShowYearPicker(false);
  };

  // Generate years list (current year ± 10)
  const years = Array.from({ length: 21 }, (_, i) => {
    const year = new Date().getFullYear() - 10 + i;
    return year;
  });

  return (
    <div className="relative" ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setShowMonthPicker(false);
            setShowYearPicker(false);
          }
        }}
        disabled={disabled}
        className={`w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-left flex items-center justify-between transition-colors ${
          isOpen
            ? "border-[#10b981] ring-1 ring-[#10b981]"
            : "border-[#27272a] hover:border-[#52525b]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={value ? "text-white" : "text-[#52525b]"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarDays size={20} className="text-[#a1a1aa] flex-shrink-0" />
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl min-w-[280px]"
          style={{
            animation: "fadeIn 0.2s ease-out forwards",
          }}
        >
          {/* Calendar Header */}
          <div className="p-3 border-b border-[#27272a]">
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-[#a1a1aa]" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowMonthPicker(!showMonthPicker);
                    setShowYearPicker(false);
                  }}
                  className="px-2 py-1 text-sm font-semibold text-white hover:bg-[#27272a] rounded-lg transition-colors"
                >
                  {MONTHS[currentMonth]}
                </button>
                <button
                  onClick={() => {
                    setShowYearPicker(!showYearPicker);
                    setShowMonthPicker(false);
                  }}
                  className="px-2 py-1 text-sm font-semibold text-white hover:bg-[#27272a] rounded-lg transition-colors"
                >
                  {currentYear}
                </button>
              </div>

              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-[#a1a1aa]" />
              </button>
            </div>
          </div>

          {/* Month Picker */}
          {showMonthPicker ? (
            <div className="p-3">
              <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      index === currentMonth
                        ? "bg-[#10b981] text-white font-semibold"
                        : "text-white hover:bg-[#27272a]"
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ) : showYearPicker ? (
            /* Year Picker */
            <div className="p-3 max-h-[240px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      year === currentYear
                        ? "bg-[#10b981] text-white font-semibold"
                        : "text-white hover:bg-[#27272a]"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Day Grid */
            <>
              {/* Day Labels */}
              <div className="px-3 pt-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-[#a1a1aa] font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>

              {/* Days */}
              <div className="px-3 pb-3">
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((dayInfo, index) => {
                    const disabled = isDisabled(dayInfo.date);
                    const today = isToday(dayInfo.date);
                    const selected = isSelected(dayInfo.date);

                    return (
                      <button
                        key={index}
                        onClick={() => handleDayClick(dayInfo.date)}
                        disabled={disabled}
                        className={`w-9 h-9 text-sm rounded-full flex items-center justify-center transition-colors ${
                          disabled
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-[#27272a] cursor-pointer"
                        } ${
                          selected
                            ? "bg-[#10b981] text-white font-semibold hover:bg-[#10b981]"
                            : today
                              ? "border-2 border-[#10b981] text-white"
                              : dayInfo.currentMonth
                                ? "text-white"
                                : "text-[#52525b]"
                        }`}
                      >
                        {dayInfo.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fade-in animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
