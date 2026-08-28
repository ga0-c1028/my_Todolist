import { useState, type JSX } from 'react';
import './DateRangePicker.css';

interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (range: DateRange) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() =>
    startOfMonth(startDate ? new Date(startDate) : new Date()),
  );

  const togglePopover = (): void => {
    setOpen((prev) => !prev);
  };

  const goPrevMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = (): void => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date): void => {
    const dateKey = toDateKey(date);

    if (!startDate || (startDate && endDate)) {
      onChange({ startDate: dateKey, endDate: null });
      return;
    }

    if (dateKey >= startDate) {
      onChange({ startDate, endDate: dateKey });
      setOpen(false);
    } else {
      onChange({ startDate: dateKey, endDate: null });
    }
  };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ];

  return (
    <div className="date-range-picker">
      <div className="date-range-picker__triggers">
        <button type="button" className="date-range-picker__trigger" onClick={togglePopover}>
          시작일자 {startDate ?? '선택해주세요'} 📅
        </button>
        <button type="button" className="date-range-picker__trigger" onClick={togglePopover}>
          종료일자 {endDate ?? '선택해주세요'} 📅
        </button>
      </div>

      {open ? (
        <div className="date-range-picker__popover">
          <div className="date-range-picker__header">
            <button type="button" className="date-range-picker__nav" onClick={goPrevMonth} aria-label="이전 달">
              ‹
            </button>
            <span className="date-range-picker__month-title">
              {year}년 {month + 1}월
            </span>
            <button type="button" className="date-range-picker__nav" onClick={goNextMonth} aria-label="다음 달">
              ›
            </button>
          </div>

          <div className="date-range-picker__weekdays">
            {WEEKDAYS.map((weekday, index) => (
              <span
                key={weekday}
                className={`date-range-picker__weekday date-range-picker__weekday--${
                  index === 0 ? 'sun' : index === 6 ? 'sat' : 'weekday'
                }`}
              >
                {weekday}
              </span>
            ))}
          </div>

          <div className="date-range-picker__grid">
            {cells.map((date, index) => {
              if (!date) {
                return <span key={`blank-${index}`} className="date-range-picker__cell date-range-picker__cell--blank" />;
              }

              const dateKey = toDateKey(date);
              const dayOfWeek = date.getDay();
              const isInRange = Boolean(startDate && endDate && dateKey >= startDate && dateKey <= endDate);
              const isToday = dateKey === todayKey;

              const classNames = [
                'date-range-picker__cell',
                dayOfWeek === 0 ? 'date-range-picker__cell--sun' : '',
                dayOfWeek === 6 ? 'date-range-picker__cell--sat' : '',
                isInRange ? 'date-range-picker__cell--in-range' : '',
                isToday ? 'date-range-picker__cell--today' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={dateKey}
                  type="button"
                  className={classNames}
                  onClick={() => handleDateClick(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
