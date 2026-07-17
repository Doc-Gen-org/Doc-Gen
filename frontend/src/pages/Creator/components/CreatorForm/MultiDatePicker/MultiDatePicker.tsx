import { useState } from "react";
import "./MultiDatePicker.css";

interface MultiDatePickerProps {
    value: string[];
    onChange: (dates: string[]) => void;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function toISO(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

function formatChip(iso: string): string {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function MultiDatePicker({ value, onChange }: MultiDatePickerProps) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const selectedSet = new Set(value);

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const goPrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11);
            setViewYear(viewYear - 1);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const goNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0);
            setViewYear(viewYear + 1);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const toggleDay = (day: number) => {
        const iso = toISO(viewYear, viewMonth, day);
        if (selectedSet.has(iso)) {
            onChange(value.filter((d) => d !== iso));
        } else {
            onChange([...value, iso].sort());
        }
    };

    const removeChip = (iso: string) => {
        onChange(value.filter((d) => d !== iso));
    };

    const clearAll = () => {
        onChange([]);
    };

    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
    });

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="multidate-picker">
            <div className="multidate-cal">
                <div className="multidate-cal-header">
                    <button type="button" className="multidate-nav" onClick={goPrevMonth}>‹</button>
                    <span className="multidate-month-label">{monthLabel}</span>
                    <button type="button" className="multidate-nav" onClick={goNextMonth}>›</button>
                </div>

                <div className="multidate-weekdays">
                    {WEEKDAYS.map((w, i) => (
                        <span key={i}>{w}</span>
                    ))}
                </div>

                <div className="multidate-grid">
                    {cells.map((day, i) => {
                        if (day === null) return <span key={i} className="multidate-cell empty" />;
                        const iso = toISO(viewYear, viewMonth, day);
                        const isSelected = selectedSet.has(iso);
                        const isToday =
                            viewYear === today.getFullYear() &&
                            viewMonth === today.getMonth() &&
                            day === today.getDate();
                        return (
                            <button
                                key={i}
                                type="button"
                                className={`multidate-cell${isSelected ? " selected" : ""}${isToday ? " today" : ""}`}
                                onClick={() => toggleDay(day)}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="multidate-selected-area">
                <div className="multidate-selected-header">
                    <span>{value.length} day{value.length === 1 ? "" : "s"} selected</span>
                    {value.length > 0 && (
                        <button type="button" className="multidate-clear" onClick={clearAll}>
                            Clear all
                        </button>
                    )}
                </div>
                {value.length > 0 && (
                    <div className="multidate-chips">
                        {value.map((iso) => (
                            <span key={iso} className="multidate-chip">
                                {formatChip(iso)}
                                <button type="button" onClick={() => removeChip(iso)}>✕</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MultiDatePicker;