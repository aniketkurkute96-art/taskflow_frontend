import { useState, useRef, useEffect } from 'react';

interface ModernDatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
}

const ModernDatePicker = ({ value, onChange, placeholder }: ModernDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDate(newDate);
    onChange(newDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    onChange(null);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const today = new Date();
    const isToday = (day: number) => {
      return (
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year
      );
    };

    const isSelected = (day: number) => {
      if (!selectedDate) return false;
      return (
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year
      );
    };

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(day);
      const isSelectedDate = isSelected(day);

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`
            h-9 w-9 rounded-lg text-sm font-medium transition-all duration-150
            ${
              isSelectedDate
                ? 'bg-indigo-600 text-white shadow-md scale-105'
                : isTodayDate
                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:ring-indigo-800'
                : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105 dark:text-slate-300 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center cursor-pointer"
      >
        <input
          type="text"
          readOnly
          value={selectedDate ? formatDate(selectedDate) : ''}
          placeholder={placeholder || 'Select date'}
          className="w-[130px] border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0 dark:text-slate-100 cursor-pointer placeholder:text-slate-400"
        />
        {selectedDate && (
          <button
            onClick={handleClear}
            className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" />
          <div className="absolute left-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800 min-w-[280px]">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <button
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div
                  key={day}
                  className="h-9 flex items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setViewDate(today);
                  onChange(today.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="w-full rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModernDatePicker;

