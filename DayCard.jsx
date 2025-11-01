import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Plus, Sun, Moon, Sparkles } from 'lucide-react';
import ShiftInputRow from './ShiftInputRow';
import StatCard from '../schedule_builder/StatCard';

const timeToDecimal = (time) => {
    if (!time) return 0;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        return hours + minutes / 60;
    } catch {
        return 0;
    }
};

const getShiftPeriod = (shift, pmCutoffDecimal) => {
    const start = timeToDecimal(shift.start_time);
    const end = timeToDecimal(shift.end_time);
    if (start >= end) return 'am';

    const amHours = Math.max(0, Math.min(end, pmCutoffDecimal) - start);
    const pmHours = Math.max(0, end - Math.max(start, pmCutoffDecimal));

    return pmHours > amHours ? 'pm' : 'am';
};

const ShiftColumn = ({ title, icon: Icon, shifts, day, positions, settings, onShiftChange, removeShift, addShift, period }) => (
    <div className="p-4 rounded-lg border flex flex-col" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg blazin-text flex items-center gap-2">
                <Icon className="w-5 h-5" style={{color: 'var(--brand-orange)'}} /> 
                {title}
            </h3>
            <Button size="sm" variant="ghost" onClick={() => addShift(day, period)} className="flex items-center gap-1 blazin-text">
                <Plus className="w-4 h-4" style={{color: 'var(--brand-orange)'}} /> Add
            </Button>
        </div>
        <div className="space-y-2">
            {shifts.length > 0 ? (
                shifts.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(shift => (
                    <ShiftInputRow
                        key={shift.tempId}
                        shift={shift}
                        day={day}
                        positions={positions}
                        settings={settings}
                        onShiftChange={onShiftChange}
                        removeShift={removeShift}
                    />
                ))
            ) : (
                <p className="text-sm text-center py-4 blazin-text-light">No {title.toLowerCase()} scheduled.</p>
            )}
        </div>
    </div>
);

export default function DayCard({ day, date, salesForDay, positions, shifts, settings, avgWage, onShiftChange, addShift, removeShift, getShiftDuration }) {
    
    const pmCutoff = timeToDecimal(settings?.midday_end_time || "17:00");

    const amShifts = shifts.filter(s => getShiftPeriod(s, pmCutoff) === 'am');
    const pmShifts = shifts.filter(s => getShiftPeriod(s, pmCutoff) === 'pm');

    const amHours = amShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const pmHours = pmShifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const totalHours = amHours + pmHours;

    const amSales = (salesForDay?.lunch_sales || 0) + (salesForDay?.midday_sales || 0);
    const pmSales = (salesForDay?.dinner_sales || 0) + (salesForDay?.late_night_sales || 0);
    const totalSales = salesForDay?.total_daily_sales || 0;

    const amLaborCost = amHours * avgWage;
    const pmLaborCost = pmHours * avgWage;
    const totalLaborCost = totalHours * avgWage;

    const amLaborPercent = amSales > 0 ? (amLaborCost / amSales) * 100 : 0;
    const pmLaborPercent = pmSales > 0 ? (pmLaborCost / pmSales) * 100 : 0;
    const totalLaborPercent = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;

    const specialEvents = salesForDay?.special_events || [];
    
    return (
        <Card className="rounded-xl overflow-hidden p-4" style={{backgroundColor: 'var(--bg-module)'}}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
                {/* Column 1: Day Header + Stats Cards + Special Events */}
                <div className="space-y-4">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold blazin-text capitalize">{day}</h2>
                        <p className="blazin-text-light">{format(date, 'MMMM d')}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        <StatCard title="Sales" am={amSales} pm={pmSales} total={totalSales} format="currency" />
                        <StatCard title="Hours" am={amHours} pm={pmHours} total={totalHours} format="hours" />
                        <StatCard title="Labor Cost" am={amLaborCost} pm={pmLaborCost} total={totalLaborCost} format="currency" />
                        <StatCard title="Labor %" am={amLaborPercent} pm={pmLaborPercent} total={totalLaborPercent} format="percent" />
                    </div>

                    {/* Special Events */}
                    {specialEvents.length > 0 && (
                        <div className="p-3 rounded-lg border space-y-2" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
                            <h4 className="font-semibold text-sm blazin-text flex items-center gap-2">
                                <Sparkles className="w-4 h-4" style={{color: 'var(--brand-orange)'}} /> 
                                Special Events
                            </h4>
                            {specialEvents.map((event, idx) => (
                                <div key={idx} className="text-xs blazin-text-light pl-2 border-l-2" style={{borderColor: 'var(--brand-orange)'}}>
                                    {event.name}
                                    {event.start_time && ` • ${event.start_time}${event.end_time ? `-${event.end_time}` : ''}`}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Column 2: AM/PM Shifts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <ShiftColumn 
                        title="AM Shifts"
                        icon={Sun}
                        shifts={amShifts}
                        day={day}
                        positions={positions}
                        settings={settings}
                        onShiftChange={onShiftChange}
                        removeShift={removeShift}
                        addShift={addShift}
                        period="am"
                    />
                    <ShiftColumn
                        title="PM Shifts"
                        icon={Moon}
                        shifts={pmShifts}
                        day={day}
                        positions={positions}
                        settings={settings}
                        onShiftChange={onShiftChange}
                        removeShift={removeShift}
                        addShift={addShift}
                        period="pm"
                    />
                </div>
            </div>
        </Card>
    );
}