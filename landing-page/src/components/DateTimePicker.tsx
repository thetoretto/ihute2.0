import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export type DateTimePickerMode = 'date' | 'time' | 'datetime';

export type DateTimePickerVariant = 'default' | 'search';

export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: DateTimePickerMode;
  minDate?: Date;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  variant?: DateTimePickerVariant;
  id?: string;
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = new Array(new Date(year, month, 1).getDay()).fill(null);
  const numDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= numDays; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

export default function DateTimePicker({
  value,
  onChange,
  mode = 'datetime',
  minDate,
  label = 'Date & Time',
  disabled = false,
  placeholder = 'Select date',
  variant = 'default',
  id,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'date' | 'time'>(
    mode === 'time' ? 'time' : 'date'
  );
  const initialDate = value ? new Date(value) : new Date();
  const [tempDate, setTempDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    setTempDate(d);
    setCurrentMonth(d);
  }, [value, isOpen]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1)
    );
  };

  const handleDateSelect = (date: Date | null) => {
    if (!date) return;
    const newDate = new Date(tempDate);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    setTempDate(newDate);
  };

  const handleTimeChange = (
    type: 'hour' | 'minute' | 'ampm',
    value: number | string
  ) => {
    const newDate = new Date(tempDate);
    if (type === 'hour') {
      const isPm = newDate.getHours() >= 12;
      let h = typeof value === 'string' ? parseInt(value, 10) : value;
      if (isPm && h < 12) h += 12;
      if (!isPm && h === 12) h = 0;
      newDate.setHours(h);
    } else if (type === 'minute') {
      newDate.setMinutes(typeof value === 'string' ? parseInt(value, 10) : value);
    } else if (type === 'ampm') {
      const currentH = newDate.getHours();
      if (value === 'PM' && currentH < 12) newDate.setHours(currentH + 12);
      if (value === 'AM' && currentH >= 12) newDate.setHours(currentH - 12);
    }
    setTempDate(newDate);
  };

  const confirmSelection = () => {
    onChange(new Date(tempDate));
    setIsOpen(false);
  };

  const openPicker = () => {
    if (disabled) return;
    setTempDate(value ? new Date(value) : new Date());
    setCurrentMonth(value ? new Date(value) : new Date());
    setView(mode === 'time' ? 'time' : 'date');
    setIsOpen(true);
  };

  const displayText =
    mode === 'time'
      ? value
        ? formatTime(value)
        : placeholder
      : mode === 'date'
        ? value
          ? formatDate(value)
          : placeholder
        : value
          ? `${formatDate(value)} ${formatTime(value)}`
          : placeholder;

  const isDateDisabled = (date: Date | null) => {
    if (!date || !minDate) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const min = new Date(
      minDate.getFullYear(),
      minDate.getMonth(),
      minDate.getDate()
    );
    return d.getTime() < min.getTime();
  };

  const isSearchVariant = variant === 'search';

  return (
    <div className="w-full">
      {!isSearchVariant && label ? (
        <label className="block text-sm font-medium text-muted mb-2 ml-1">
          {label}
        </label>
      ) : null}
      {isSearchVariant ? (
        <button
          type="button"
          id={id}
          onClick={openPicker}
          disabled={disabled}
          className={`rs-search-date-trigger ${!value ? 'empty' : ''}`}
          aria-label={label || 'Select date'}
        >
          {displayText}
        </button>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="w-full bg-white border border-soft p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold text-dark">
              {displayText}
            </span>
            {mode === 'datetime' && value && (
              <span className="text-muted text-sm">{formatTime(value)}</span>
            )}
          </div>
          <div className="bg-soft p-2 rounded-xl">
            <Calendar className="text-primary w-6 h-6" />
          </div>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out safe-area-bottom ${
          isSearchVariant ? 'rs-search-date-dropdown rs-date-sheet-search rounded-t-2xl' : 'rs-date-sheet'
        } ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="rs-date-sheet-inner">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-soft rounded-full"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-muted" />
            </button>
            {mode === 'datetime' && (
              <div className="flex bg-soft p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setView('date')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    view === 'date'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-muted'
                  }`}
                >
                  Date
                </button>
                <button
                  type="button"
                  onClick={() => setView('time')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    view === 'time'
                      ? 'bg-white shadow-sm text-primary'
                      : 'text-muted'
                  }`}
                >
                  Time
                </button>
              </div>
            )}
            {mode !== 'datetime' && <div />}
            <button
              type="button"
              onClick={confirmSelection}
              className="p-2 bg-primary text-dark rounded-full shadow-lg shadow-soft"
              aria-label="Confirm"
            >
              <Check className="w-6 h-6" />
            </button>
          </div>

          {view === 'date' && (mode === 'date' || mode === 'datetime') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="font-bold text-lg text-dark">
                  {currentMonth.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="p-2 hover:bg-soft rounded-lg"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="p-2 hover:bg-soft rounded-lg"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    className="text-center text-xs font-bold text-muted py-2"
                  >
                    {d}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, idx) => {
                  const isSelected =
                    date &&
                    date.toDateString() === tempDate.toDateString();
                  const isToday =
                    date &&
                    date.toDateString() === new Date().toDateString();
                  const isDisabled = isDateDisabled(date);

                  return (
                    <button
                      key={date ? date.getTime() : `empty-${idx}`}
                      type="button"
                      disabled={!date || isDisabled}
                      onClick={() => !isDisabled && handleDateSelect(date)}
                      className={`
                        aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                        ${!date ? 'invisible' : 'hover:bg-soft'}
                        ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                        ${
                          isSelected
                            ? 'bg-primary text-dark shadow-md scale-110'
                            : 'text-dark'
                        }
                        ${
                          isToday && !isSelected
                            ? 'text-primary ring-1 ring-inset ring-primary/30'
                            : ''
                        }
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'time' && (mode === 'time' || mode === 'datetime') && (
            <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="rs-date-time-value mb-2">
                    {tempDate.getHours() === 0
                      ? '12'
                      : tempDate.getHours() > 12
                        ? (tempDate.getHours() - 12)
                            .toString()
                            .padStart(2, '0')
                        : tempDate
                          .getHours()
                          .toString()
                          .padStart(2, '0')}
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={
                      tempDate.getHours() > 12
                        ? tempDate.getHours() - 12
                        : tempDate.getHours() === 0
                          ? 12
                          : tempDate.getHours()
                    }
                    onChange={(e) =>
                      handleTimeChange('hour', e.target.value)
                    }
                    className="w-24 accent-primary"
                  />
                  <span className="text-xs uppercase font-bold text-muted mt-2">
                    Hour
                  </span>
                </div>

                <span className="text-4xl font-light text-muted mb-8">
                  :
                </span>

                <div className="flex flex-col items-center">
                  <span className="rs-date-time-value mb-2">
                    {tempDate.getMinutes().toString().padStart(2, '0')}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="59"
                    value={tempDate.getMinutes()}
                    onChange={(e) =>
                      handleTimeChange('minute', e.target.value)
                    }
                    className="w-24 accent-primary"
                  />
                  <span className="text-xs uppercase font-bold text-muted mt-2">
                    Min
                  </span>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    type="button"
                    onClick={() => handleTimeChange('ampm', 'AM')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      tempDate.getHours() < 12
                        ? 'bg-primary text-dark'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeChange('ampm', 'PM')}
                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      tempDate.getHours() >= 12
                        ? 'bg-primary text-dark'
                        : 'bg-soft text-muted'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-2">
                {[0, 15, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleTimeChange('minute', m)}
                    className="py-2 rounded-xl bg-soft text-dark text-sm font-medium hover:bg-soft hover:text-primary border border-soft"
                  >
                    :{m.toString().padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-muted text-xs">
            Swipe down to dismiss
          </div>
        </div>
      </div>
    </div>
  );
}
