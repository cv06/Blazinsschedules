
import React, { useMemo } from 'react';
import { format, parse } from 'date-fns';
import { formatTime } from '@/components/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle } from 'lucide-react';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function EmployeeView({ schedule, shifts, employees, isPrintView }) {
    const { week_start_date } = schedule;

    const employeeSchedules = useMemo(() => {
        return employees.map(emp => {
            const empShifts = shifts
                .filter(s => s.employee_id === emp.employee_id)
                .sort((a,b) => new Date(a.date + 'T' + a.start_time) - new Date(b.date + 'T' + b.start_time));
            
            const totalHours = empShifts.reduce((sum, s) => sum + (s.hours || 0), 0);

            return { ...emp, shifts: empShifts, totalHours };
        }).filter(emp => emp.shifts.length > 0)
          .sort((a, b) => a.first_name.localeCompare(b.first_name));
    }, [shifts, employees]);

    return (
        <div className={`p-4 rounded-lg ${isPrintView ? '' : ''}`} style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-divider)'}}>
            <h2 className="text-2xl font-bold text-center mb-4 blazin-text">
                Employee Schedules for Week of {format(new Date(week_start_date + 'T00:00:00'), 'MMMM d, yyyy')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employeeSchedules.map(emp => (
                    <div key={emp.id} className={`rounded-lg p-4 border`} style={{backgroundColor: isPrintView ? 'white' : 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                        <div className="flex justify-between items-baseline">
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold blazin-text text-lg">{emp.first_name} {emp.last_name}</h3>
                             {emp.min_hours && emp.totalHours < emp.min_hours && (
                               <TooltipProvider>
                                 <Tooltip>
                                   <TooltipTrigger>
                                     <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                   </TooltipTrigger>
                                   <TooltipContent>
                                     <p>Does not meet minimum {emp.min_hours} hours</p>
                                   </TooltipContent>
                                 </Tooltip>
                               </TooltipProvider>
                             )}
                           </div>
                           <p className="text-sm font-bold blazin-text-light">{emp.totalHours.toFixed(1)} hrs</p>
                        </div>
                        <hr className="my-2" style={{borderColor: 'var(--bg-divider)'}} />
                        <div className="space-y-2 text-sm">
                            {emp.shifts.map(shift => (
                                <div key={shift.id} className="grid grid-cols-3 gap-2">
                                    <div className="font-semibold blazin-text-light">
                                        {format(parse(shift.date, 'yyyy-MM-dd', new Date()), 'EEE, M/d')}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="blazin-text">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</div>
                                        <div className="text-xs blazin-text-light">{shift.position}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

