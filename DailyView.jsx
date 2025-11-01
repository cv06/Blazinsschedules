
import React, { useMemo } from 'react';
import { format, addDays, parse } from 'date-fns';
import { formatTime } from '@/components/lib/utils';
import { Sun, Moon, Clock, DollarSign, Percent, Zap } from 'lucide-react';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const timeToDecimal = (time) => {
    if (!time) return 0;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        return hours + minutes / 60;
    } catch {
        return 0;
    }
};

const ShiftTable = ({ shifts, isPrintView }) => (
    <table className={`w-full text-sm text-left border-collapse`}>
        <thead className={`border-b-2`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>
            <tr>
                <th className={`p-2 font-semibold blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>Employee</th>
                <th className={`p-2 font-semibold blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>Position</th>
                <th className={`p-2 font-semibold blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>In</th>
                <th className={`p-2 font-semibold blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>Est Out</th>
            </tr>
        </thead>
        <tbody>
            {shifts.length > 0 ? shifts.map(shift => (
                <tr key={shift.id} className={`border-b`} style={{borderColor: isPrintView ? '#ccc' : 'var(--bg-divider)'}}>
                    <td className={`p-2 blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>{shift.employee?.first_name} {shift.employee?.last_name}</td>
                    <td className={`p-2 blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>{shift.position}</td>
                    <td className={`p-2 blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>{formatTime(shift.start_time)}</td>
                    <td className={`p-2 blazin-text border`} style={{borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>{formatTime(shift.end_time)}</td>
                </tr>
            )) : (
                <tr>
                    <td colSpan="4" className={`p-4 text-center border`} style={{color: 'var(--text-charcoal)', opacity: 0.6, borderColor: isPrintView ? '#333' : 'var(--text-charcoal)'}}>No shifts scheduled.</td>
                </tr>
            )}
        </tbody>
    </table>
);

const DailyStats = ({ totals }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 mt-2 rounded-lg" style={{backgroundColor: 'var(--bg-divider)'}}>
        <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <div>
                <div className="text-xs text-gray-500">Hours</div>
                <div className="font-bold">{totals.totalHours.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Opening: {totals.preOpenHours.toFixed(1)}h | Closing: {totals.postCloseHours.toFixed(1)}h</div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <div>
                <div className="text-xs text-gray-500">Labor Cost</div>
                <div className="font-bold">${totals.totalLaborCost.toFixed(2)}</div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-gray-600" />
            <div>
                <div className="text-xs text-gray-500">Labor %</div>
                <div className="font-bold">{totals.laborPercentage.toFixed(1)}%</div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-600" />
            <div>
                <div className="text-xs text-gray-500">SPLH</div>
                <div className="font-bold">${totals.salesPerLaborHour.toFixed(2)}</div>
            </div>
        </div>
    </div>
);


export default function DailyView({ schedule, shifts, employees, sales, settings, isPrintView }) {
    const { week_start_date } = schedule;

    const dailySchedules = useMemo(() => {
        const pmCutoff = timeToDecimal(settings?.midday_end_time || "17:00");
        const employeeMap = new Map(employees.map(e => [e.employee_id, e]));
        
        return DAYS_OF_WEEK.map((day, index) => {
            const date = format(addDays(parse(week_start_date, 'yyyy-MM-dd', new Date()), index), 'yyyy-MM-dd');
            const dayShifts = shifts
                .filter(s => s.date === date && s.employee_id)
                .map(s => ({
                    ...s,
                    employee: employeeMap.get(s.employee_id)
                }))
                .sort((a,b) => timeToDecimal(a.start_time) - timeToDecimal(b.start_time));
            
            const daySales = sales.find(s => s.day_of_week === day);

            let totalHours = 0;
            let totalLaborCost = 0;
            const totalSales = daySales?.total_daily_sales || 0;
            let preOpenHours = 0;
            let postCloseHours = 0;
            const openTime = timeToDecimal(settings?.open_time);
            const closeTime = timeToDecimal(settings?.close_time);

            dayShifts.forEach(shift => {
                const shiftHours = shift.hours || 0;
                totalHours += shiftHours;
                const employee = employeeMap.get(shift.employee_id);
                if (employee && employee.pay_type === 'hourly') {
                    totalLaborCost += shiftHours * employee.hourly_rate;
                }
                // Calculate pre-open and post-close hours
                // Ensure openTime and closeTime are valid numbers before comparison
                if (typeof openTime === 'number' && typeof closeTime === 'number') {
                    const shiftStart = timeToDecimal(shift.start_time);
                    const shiftEnd = timeToDecimal(shift.end_time);
                    
                    if (shiftStart < openTime) {
                        preOpenHours += Math.max(0, Math.min(openTime, shiftEnd) - shiftStart);
                    }
                    if (shiftEnd > closeTime) {
                        postCloseHours += Math.max(0, shiftEnd - Math.max(closeTime, shiftStart));
                    }
                }
            });
            const laborPercentage = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;
            const salesPerLaborHour = totalHours > 0 ? totalSales / totalHours : 0;

            return {
                day,
                date,
                amShifts: dayShifts.filter(s => timeToDecimal(s.start_time) < pmCutoff),
                pmShifts: dayShifts.filter(s => timeToDecimal(s.start_time) >= pmCutoff),
                totals: { totalHours, totalLaborCost, totalSales, laborPercentage, salesPerLaborHour, preOpenHours, postCloseHours }
            };
        });
    }, [shifts, employees, sales, week_start_date, settings]);

    return (
        <div className={`space-y-8 ${isPrintView ? '' : ''}`}>
             <h2 className={`text-2xl font-bold text-center mb-4 blazin-text ${isPrintView ? 'print:block' : 'print:hidden'}`}>
                Daily Schedules for Week of {format(new Date(week_start_date + 'T00:00:00'), 'MMMM d, yyyy')}
            </h2>
            {dailySchedules.map(({ day, date, amShifts, pmShifts, totals }, index) => (
                <div 
                    key={day} 
                    className={`p-4 rounded-lg border`}
                    style={{
                        backgroundColor: isPrintView ? 'white' : 'var(--bg-module)', 
                        borderColor: isPrintView ? '#333' : 'var(--text-charcoal)',
                    }}
                    data-print-page-break={isPrintView && index > 0}
                >
                    <h3 className={`${isPrintView ? 'text-xl' : 'text-xl'} font-bold blazin-text mb-1 text-center`}>
                        {format(parse(date, 'yyyy-MM-dd', new Date()), 'EEEE, MMMM d')}
                    </h3>
                    
                    {!isPrintView && <DailyStats totals={totals} />}
                    
                    <div className="space-y-4 mt-4">
                        <div>
                            <h4 className="font-semibold blazin-text flex items-center gap-2 mb-2"><Sun className="w-4 h-4" /> AM Shifts</h4>
                            <ShiftTable shifts={amShifts} isPrintView={isPrintView} />
                        </div>
                        
                        <hr className={`my-4`} style={{borderColor: isPrintView ? '#ccc' : 'var(--bg-divider)'}} />

                        <div>
                            <h4 className="font-semibold blazin-text flex items-center gap-2 mb-2"><Moon className="w-4 h-4" /> PM Shifts</h4>
                            <ShiftTable shifts={pmShifts} isPrintView={isPrintView} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
