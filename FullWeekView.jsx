
import React, { useMemo } from 'react';
import { format, addDays, parse } from 'date-fns';
import { formatTime } from '@/components/lib/utils';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
};

const formatPrintableName = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length <= 1) {
    return name;
  }
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0);
  return `${firstName} ${lastInitial}.`;
};

export default function FullWeekView({ schedule, shifts, employees, sales, settings, isPrintView }) {
    const { week_start_date } = schedule;

    const data = useMemo(() => {
        const pmCutoff = timeToDecimal(settings?.midday_end_time || "17:00");
        const scheduledEmployeeIds = [...new Set(shifts.map(s => s.employee_id))];
        const employeeMap = new Map(employees.map(e => [e.employee_id, e]));

        return scheduledEmployeeIds
            .map(empId => employeeMap.get(empId))
            .filter(emp => emp)
            .sort((a,b) => a.first_name.localeCompare(b.first_name))
            .map(emp => {
                const row = { 
                    employeeName: `${emp.first_name} ${emp.last_name}`, 
                    days: {} 
                };
                DAYS_OF_WEEK.forEach((day, index) => {
                    const date = format(addDays(parse(week_start_date, 'yyyy-MM-dd', new Date()), index), 'yyyy-MM-dd');
                    const dayShifts = shifts
                        .filter(s => s.date === date && s.employee_id === emp.employee_id)
                        .map(s => {
                            const isClosing = settings?.close_time && timeToDecimal(s.end_time) >= timeToDecimal(settings.close_time);
                            return {
                                startTime: s.start_time,
                                endTime: s.end_time, // Pass end_time
                                isClosing: isClosing
                            };
                        })
                        .sort((a,b) => timeToDecimal(a.startTime) - timeToDecimal(b.startTime));
                    
                    row.days[day] = {
                        am: dayShifts.filter(s => timeToDecimal(s.startTime) < pmCutoff),
                        pm: dayShifts.filter(s => timeToDecimal(s.startTime) >= pmCutoff),
                    };
                });
                return row;
            });
    }, [shifts, employees, week_start_date, settings]);
    
    const dailySales = useMemo(() => {
        const salesMap = {};
        DAYS_OF_WEEK.forEach(day => {
            const daySale = sales.find(s => s.day_of_week === day);
            salesMap[day] = daySale ? daySale.total_daily_sales : 0;
        });
        return salesMap;
    }, [sales]);

    return (
        <div className={isPrintView ? '' : 'p-4 rounded-lg'} style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-divider)'}}>
            <h2 className={`${isPrintView ? 'text-lg' : 'text-2xl'} font-bold text-center mb-4 blazin-text`}>
                Week of {format(new Date(week_start_date + 'T00:00:00'), 'MMMM d, yyyy')}
            </h2>
            <div className="overflow-x-auto">
                <table className={`border-collapse ${isPrintView ? 'text-xs table-auto' : 'text-sm w-full'}`}>
                    <thead>
                        <tr style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-module)'}}>
                            <th rowSpan="2" className={`${isPrintView ? 'p-2 border-gray-800' : 'p-3 border-charcoal'} font-bold uppercase blazin-text text-left border align-middle`}>Employee</th>
                            {DAYS_OF_WEEK.map((day, index) => (
                                <th key={day} colSpan="2" className={`${isPrintView ? 'p-2 border-gray-800' : 'p-3 border-charcoal'} font-bold uppercase blazin-text border text-center`}>
                                    <div>{day.slice(0,3)}</div>
                                    <div className="font-normal text-xs">{format(addDays(new Date(week_start_date + 'T00:00:00'), index), 'M/d')}</div>
                                </th>
                            ))}
                        </tr>
                        <tr style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-module)'}}>
                            {DAYS_OF_WEEK.map(day => (
                                <React.Fragment key={`${day}-sub`}>
                                    <th className={`${isPrintView ? 'p-1 border-gray-800' : 'p-2 border-charcoal'} font-semibold blazin-text border text-center`}>AM</th>
                                    <th className={`${isPrintView ? 'p-1 border-gray-800' : 'p-2 border-charcoal'} font-semibold blazin-text border text-center`}>PM</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(({ employeeName, days }) => (
                            <tr key={employeeName} style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-module)'}}>
                                <td className={`${isPrintView ? 'p-1 border-gray-800' : 'p-2 border-charcoal'} font-bold blazin-text border align-top`}>
                                    {isPrintView ? formatPrintableName(employeeName) : employeeName}
                                </td>
                                {DAYS_OF_WEEK.map(day => (
                                    <React.Fragment key={day}>
                                        <td className={`${isPrintView ? 'p-1 border-gray-800' : 'p-2 border-charcoal'} ${isPrintView ? '' : 'h-24'} border align-top`}>
                                            {days[day].am.map((shift, i) => (
                                                <div key={i} className="text-xs mb-1">
                                                    {settings?.show_end_times_on_week_view ? (
                                                        `${formatTime(shift.startTime)}-${formatTime(shift.endTime)}`
                                                    ) : (
                                                        <>
                                                            {formatTime(shift.startTime)}
                                                            {shift.isClosing && <span className="font-bold"> CL</span>}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                        <td className={`${isPrintView ? 'p-1 border-gray-800' : 'p-2 border-charcoal'} ${isPrintView ? '' : 'h-24'} border align-top`}>
                                            {days[day].pm.map((shift, i) => (
                                                <div key={i} className="text-xs mb-1">
                                                    {settings?.show_end_times_on_week_view ? (
                                                        `${formatTime(shift.startTime)}-${formatTime(shift.endTime)}`
                                                    ) : (
                                                        <>
                                                            {formatTime(shift.startTime)}
                                                            {shift.isClosing && <span className="font-bold"> CL</span>}
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </td>
                                    </React.Fragment>
                                ))}
                            </tr>
                        ))}
                         <tr className="font-bold" style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-module)'}}>
                            <td className={`${isPrintView ? 'p-2 border-gray-800' : 'p-3 border-charcoal'} blazin-text border`}>PROJ. SALES</td>
                            {DAYS_OF_WEEK.map(day => (
                                <td key={day} colSpan="2" className={`${isPrintView ? 'p-1 border-gray-800' : 'p-3 border-charcoal'} blazin-text border text-center`}>
                                    ${dailySales[day].toLocaleString()}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
