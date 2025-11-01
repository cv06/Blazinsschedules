
import React, { useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { formatTime } from '@/components/lib/utils';
import AssignShiftPopover from './AssignShiftPopover';
import { X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
};

const HeaderCell = ({ day, date, sales }) => (
    <div className="rounded-lg overflow-hidden flex flex-col" style={{backgroundColor: 'var(--bg-divider)'}}>
        <div className="p-2 text-center" style={{backgroundColor: 'var(--bg-module)'}}>
            <div className="font-bold uppercase blazin-text">{day}</div>
            <div className="text-xs blazin-text-light">{format(date, 'MMM d')}</div>
        </div>
        <div className="py-1 px-2 text-xs blazin-text-light flex justify-around">
            <span>AM: ${sales.amSales.toLocaleString()}</span>
            <span>PM: ${sales.pmSales.toLocaleString()}</span>
        </div>
    </div>
);

const EmployeeCell = ({ employee }) => (
    <div className="sticky left-0 p-3 h-full rounded-lg flex items-center z-10" style={{backgroundColor: 'var(--bg-divider)'}}>
        <p className="font-semibold blazin-text">{employee.first_name} {employee.last_name}</p>
    </div>
);

const ShiftCard = ({ shift, onUnassign }) => {
    const shiftDuration = useMemo(() => {
        if (!shift.start_time || !shift.end_time) return '0.0';
        const start = timeToDecimal(shift.start_time);
        let end = timeToDecimal(shift.end_time);
        if (end < start) end += 24; // Handle overnight
        return (end - start).toFixed(1);
    }, [shift.start_time, shift.end_time]);

    return (
        <div className="group relative p-2 rounded-lg space-y-2" style={{backgroundColor: 'var(--bg-divider)'}}>
            <div className="text-center">
                <p className="font-semibold blazin-text text-sm whitespace-nowrap">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                <span className="text-xs font-bold" style={{color: 'var(--brand-orange)'}}>({shiftDuration} hrs)</span>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
                {(shift.position || []).map(pos => (
                    <Badge key={pos} className="text-xs px-2 py-0.5 rounded-md" style={{backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)'}}>
                        {pos}
                    </Badge>
                ))}
            </div>
            <button 
                onClick={() => onUnassign(shift)} 
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                aria-label="Unassign shift"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
};

export default function ScheduleGridView({ weekStartDate, allData, onShiftsChange }) {
    const { shifts, employees, sales, availability, timeOff } = allData;

    const processedData = useMemo(() => {
        const salesByDay = new Map();
        sales.forEach(s => {
            const amSales = (s.lunch_sales || 0) + (s.midday_sales || 0);
            const pmSales = (s.dinner_sales || 0) + (s.late_night_sales || 0);
            salesByDay.set(s.day_of_week, { amSales, pmSales });
        });

        const shiftsByEmployeeDay = new Map();
        const unassignedShiftsByDay = new Map();

        shifts.forEach(shift => {
            const date = shift.date;
            if (shift.employee_id) {
                if (!shiftsByEmployeeDay.has(shift.employee_id)) {
                    shiftsByEmployeeDay.set(shift.employee_id, new Map());
                }
                if (!shiftsByEmployeeDay.get(shift.employee_id).has(date)) {
                    shiftsByEmployeeDay.get(shift.employee_id).set(date, []);
                }
                shiftsByEmployeeDay.get(shift.employee_id).get(date).push(shift);
            } else {
                if (!unassignedShiftsByDay.has(date)) {
                    unassignedShiftsByDay.set(date, []);
                }
                unassignedShiftsByDay.get(date).push(shift);
            }
        });

        return { salesByDay, shiftsByEmployeeDay, unassignedShiftsByDay };
    }, [shifts, employees, sales]);

    const getAvailableShiftsForEmployee = (employee, unassignedShifts, date, dayOfWeek) => {
        const employeePositions = new Set(employee.positions || []);
        const employeeAvailability = availability.find(a => a.employee_id === employee.employee_id && a.day_of_week === dayOfWeek);
        const employeeTimeOff = timeOff.filter(t => t.employee_id === employee.employee_id && t.request_date === date);

        return unassignedShifts.filter(shift => {
            const shiftPositions = shift.position || [];
            if (!shiftPositions.some(p => employeePositions.has(p))) {
                return false;
            }

            if (!employeeAvailability?.is_available) {
                return false;
            }
            
            const shiftStart = timeToDecimal(shift.start_time);
            const shiftEnd = timeToDecimal(shift.end_time);
            const availStart = timeToDecimal(employeeAvailability.start_time);
            const availEnd = timeToDecimal(employeeAvailability.end_time);

            if (shiftStart < availStart || shiftEnd > availEnd) {
                return false;
            }

            const hasConflict = employeeTimeOff.some(to => {
                if (to.is_all_day) return true;
                if (to.start_time && to.end_time) {
                    const timeOffStart = timeToDecimal(to.start_time);
                    const timeOffEnd = timeToDecimal(to.end_time);
                    return Math.max(shiftStart, timeOffStart) < Math.min(shiftEnd, timeOffEnd);
                }
                return false;
            });

            return !hasConflict;
        });
    };

    const handleUnassign = (shift) => {
        onShiftsChange({ ...shift, employee_id: null });
    };

    const activeEmployees = employees.filter(e => e.is_active).sort((a,b) => a.first_name.localeCompare(b.first_name));

    return (
        <div className="overflow-x-auto p-1">
            <div 
                className="grid gap-2" 
                style={{ 
                    gridTemplateColumns: 'minmax(180px, 1fr) repeat(7, minmax(200px, 1fr))',
                    gridTemplateRows: `auto repeat(${activeEmployees.length}, minmax(100px, auto))`
                }}
            >
                {/* Header Row */}
                <div className="sticky left-0 p-3 rounded-lg flex items-center z-10" style={{backgroundColor: 'var(--bg-divider)'}}>
                    <p className="font-bold uppercase blazin-text">Employee</p>
                </div>
                {DAYS_OF_WEEK.map((day, index) => {
                    const date = addDays(weekStartDate, index);
                    const daySales = processedData.salesByDay.get(day) || { amSales: 0, pmSales: 0 };
                    return <HeaderCell key={day} day={day} date={date} sales={daySales} />;
                })}

                {/* Employee Rows */}
                {activeEmployees.map(employee => (
                    <React.Fragment key={employee.id}>
                        <EmployeeCell employee={employee} />
                        {DAYS_OF_WEEK.map((day, index) => {
                            const date = format(addDays(weekStartDate, index), "yyyy-MM-dd");
                            const dayOfWeek = day.toLowerCase();
                            const assignedShifts = processedData.shiftsByEmployeeDay.get(employee.employee_id)?.get(date) || [];
                            const unassignedShiftsForDay = processedData.unassignedShiftsByDay.get(date) || [];
                            const availableShifts = getAvailableShiftsForEmployee(employee, unassignedShiftsForDay, date, dayOfWeek);
                            
                            return (
                                <div key={date} className="p-2 rounded-lg flex flex-col gap-2" style={{backgroundColor: 'var(--bg-module)'}}>
                                    <div className="flex-grow space-y-2">
                                        {assignedShifts.sort((a,b) => timeToDecimal(a.start_time) - timeToDecimal(b.start_time)).map(shift => (
                                            <ShiftCard key={shift.id} shift={shift} onUnassign={handleUnassign} />
                                        ))}
                                    </div>
                                    {availableShifts.length > 0 && (
                                        <AssignShiftPopover
                                            employee={employee}
                                            date={date}
                                            unassignedShifts={availableShifts}
                                            onShiftsChange={onShiftsChange}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
