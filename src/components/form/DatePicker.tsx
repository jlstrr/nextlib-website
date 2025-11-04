import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  isDateDisabled?: (date: string) => boolean;
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  disabled = false,
  className = "",
  placeholder = "Select date",
  isDateDisabled
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      return new Date(value);
    }
    return new Date();
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date for display
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: string }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - (startingDayOfWeek - 1 - i));
      const prevYear = prevMonthDay.getFullYear();
      const prevMonth = String(prevMonthDay.getMonth() + 1).padStart(2, '0');
      const prevDay = String(prevMonthDay.getDate()).padStart(2, '0');
      days.push({
        date: prevMonthDay.getDate(),
        isCurrentMonth: false,
        fullDate: `${prevYear}-${prevMonth}-${prevDay}`
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: `${year}-${monthStr}-${dayStr}`
      });
    }

    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDay = new Date(year, month + 1, day);
      const nextYear = nextMonthDay.getFullYear();
      const nextMonth = String(nextMonthDay.getMonth() + 1).padStart(2, '0');
      const nextDay = String(nextMonthDay.getDate()).padStart(2, '0');
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: `${nextYear}-${nextMonth}-${nextDay}`
      });
    }

    return days;
  };

  // Check if date should be disabled
  const isDayDisabled = (fullDate: string) => {
    if (!fullDate) return true;
    
    // Check minimum date
    if (minDate && fullDate < minDate) return true;
    
    // Check custom disabled function
    if (isDateDisabled && isDateDisabled(fullDate)) return true;
    
    return false;
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Select date
  const selectDate = (fullDate: string) => {
    if (!isDayDisabled(fullDate)) {
      onChange(fullDate);
      setIsOpen(false);
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="relative">
      {/* Input Field */}
      <div
        ref={inputRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full rounded-lg border-2 px-4 py-3 text-sm transition-all duration-200 cursor-pointer
          ${disabled 
            ? 'border-gray-200 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
          }
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          ${className}
        `}
      >
        <div className="flex items-center justify-between">
          <span className={value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
          <FaCalendarAlt className={`w-4 h-4 ${disabled ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'}`} />
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl z-50 p-4"
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {monthName}
            </h3>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FaChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isSelected = value === day.fullDate;
              const isDisabled = isDayDisabled(day.fullDate);
              const isToday = day.fullDate === new Date().toISOString().split('T')[0];
              
              return (
                <button
                  key={index}
                  onClick={() => selectDate(day.fullDate)}
                  disabled={isDisabled}
                  className={`
                    w-10 h-10 text-sm rounded-lg transition-all duration-200 relative
                    ${!day.isCurrentMonth 
                      ? 'text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                      : isSelected
                      ? 'bg-blue-500 text-white shadow-lg'
                      : isDisabled
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {day.date}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => selectDate(new Date().toISOString().split('T')[0])}
              disabled={isDayDisabled(new Date().toISOString().split('T')[0])}
              className="w-full py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}