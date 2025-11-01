
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { formatTime } from '../lib/utils';
import { DollarSign, MessageSquare, Clock, Percent, Zap, Sun, Moon, AlertTriangle } from 'lucide-react';

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
};

export default function AuditDayCard({ day, date, shiftsForDay, salesForDay, employees, onDataChange, reason, onReasonChange, settings }) {
    const employeeMap = new Map(employees.map(e => [e.employee_id, e]));

    let projectedHours = 0;
    let actualHours = 0;
    let projectedLaborCost = 0;
    let actualLaborCost = 0;
    let preOpenHours = 0;
    let postCloseHours = 0;
    
    // AM/PM split calculations
    const pmCutoff = timeToDecimal(settings?.midday_end_time || "17:00");
    let projectedAmHours = 0;
    let projectedPmHours = 0;
    let actualAmHours = 0;
    let actualPmHours = 0;
    let projectedAmLaborCost = 0;
    let projectedPmLaborCost = 0;
    let actualAmLaborCost = 0;
    let actualPmLaborCost = 0;
    
    const openTime = timeToDecimal(settings?.open_time);
    const closeTime = timeToDecimal(settings?.close_time);

    shiftsForDay.forEach(shift => {
        const employee = employeeMap.get(shift.employee_id);
        if (employee) {
            const projHours = shift.hours || 0;
            const actHours = Math.max(0, timeToDecimal(shift.actual_end_time) - timeToDecimal(shift.actual_start_time));
            projectedHours += projHours;
            actualHours += actHours;
            
            const shiftStartTime = timeToDecimal(shift.start_time);
            const isAmShift = shiftStartTime < pmCutoff;
            
            if (employee.pay_type === 'hourly') {
                const projCost = projHours * employee.hourly_rate;
                const actCost = actHours * employee.hourly_rate;
                projectedLaborCost += projCost;
                actualLaborCost += actCost;
                
                if (isAmShift) {
                    projectedAmHours += projHours;
                    actualAmHours += actHours;
                    projectedAmLaborCost += projCost;
                    actualAmLaborCost += actCost;
                } else {
                    projectedPmHours += projHours;
                    actualPmHours += actHours;
                    projectedPmLaborCost += projCost;
                    actualPmLaborCost += actCost;
                }
            }

            if (openTime && closeTime) {
                const shiftStart = timeToDecimal(shift.actual_start_time || shift.start_time);
                const shiftEnd = timeToDecimal(shift.actual_end_time || shift.end_time);
                
                if (shiftStart < openTime) {
                    preOpenHours += Math.max(0, Math.min(openTime, shiftEnd) - shiftStart);
                }
                if (shiftEnd > closeTime) {
                    postCloseHours += Math.max(0, shiftEnd - Math.max(closeTime, shiftStart));
                }
            }
        }
    });

    // Calculate sales figures
    const projectedAmSales = (salesForDay?.lunch_sales || 0) + (salesForDay?.midday_sales || 0);
    const projectedPmSales = (salesForDay?.dinner_sales || 0) + (salesForDay?.late_night_sales || 0);
    const projectedTotalSales = salesForDay?.total_daily_sales || 0;
    
    const actualAmSales = salesForDay?.actual_am_sales || 0;
    const actualPmSales = salesForDay?.actual_pm_sales || 0;
    const actualTotalSales = actualAmSales + actualPmSales;
    
    // Calculate labor percentages
    const projectedAmLaborPercent = projectedAmSales > 0 ? (projectedAmLaborCost / projectedAmSales) * 100 : 0;
    const projectedPmLaborPercent = projectedPmSales > 0 ? (projectedPmLaborCost / projectedPmSales) * 100 : 0;
    const actualAmLaborPercent = actualAmSales > 0 ? (actualAmLaborCost / actualAmSales) * 100 : 0;
    const actualPmLaborPercent = actualPmSales > 0 ? (actualPmLaborCost / actualPmSales) * 100 : 0;
    const actualTotalLaborPercent = actualTotalSales > 0 ? (actualLaborCost / actualTotalSales) * 100 : 0;

    return (
        <Card className="border rounded-lg" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
            <CardHeader className="rounded-t-lg border-b p-4" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold blazin-text capitalize">{day}</h3>
                            <div className="text-sm blazin-text-light">{format(new Date(date + 'T00:00:00'), 'MMM d')}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-semibold blazin-text">Total Projected Sales</div>
                            <div className="text-lg font-bold" style={{color: 'var(--text-charcoal)', opacity: 0.7}}>${projectedTotalSales.toLocaleString()}</div>
                        </div>
                    </div>
                    
                    {/* AM and PM Sales Input Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                            <div className="flex items-center gap-2 mb-2">
                                <Sun className="w-4 h-4" style={{color: 'var(--brand-orange)'}} />
                                <span className="font-semibold blazin-text">AM Sales</span>
                            </div>
                            <div className="text-xs blazin-text-light mb-1">Projected: ${projectedAmSales.toLocaleString()}</div>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color: 'var(--brand-orange)'}} />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={actualAmSales || ""}
                                    onChange={(e) => onDataChange('sales', salesForDay.id, 'actual_am_sales', e.target.value)}
                                    className="font-bold pl-8"
                                />
                            </div>
                        </div>
                        
                        <div className="p-3 rounded-lg border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                            <div className="flex items-center gap-2 mb-2">
                                <Moon className="w-4 h-4" style={{color: 'var(--brand-orange)'}} />
                                <span className="font-semibold blazin-text">PM Sales</span>
                            </div>
                            <div className="text-xs blazin-text-light mb-1">Projected: ${projectedPmSales.toLocaleString()}</div>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color: 'var(--brand-orange)'}} />
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={actualPmSales || ""}
                                    onChange={(e) => onDataChange('sales', salesForDay.id, 'actual_pm_sales', e.target.value)}
                                    className="font-bold pl-8"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {/* Daily Total Display */}
                    <div className="text-center p-2 rounded-lg border" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
                        <div className="font-semibold blazin-text">Total Actual Sales</div>
                        <div className="text-xl font-bold" style={{color: 'var(--brand-orange)'}}>${actualTotalSales.toLocaleString()}</div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b" style={{borderColor: 'var(--text-charcoal)'}}>
                                <th className="p-2 text-left font-semibold blazin-text">Employee</th>
                                <th className="p-2 text-left font-semibold blazin-text">Position</th>
                                <th className="p-2 text-center font-semibold blazin-text">Projected</th>
                                <th className="p-2 text-center font-semibold blazin-text">Actual</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shiftsForDay.length > 0 ? shiftsForDay.map(shift => {
                                const employee = employeeMap.get(shift.employee_id);
                                const projHours = shift.hours || 0;
                                const actualHours = Math.max(0, timeToDecimal(shift.actual_end_time) - timeToDecimal(shift.actual_start_time));
                                const variance = actualHours - projHours;
                                const showVarianceReasonInput = Math.abs(variance) >= 0.25;

                                return (
                                    <React.Fragment key={shift.id}>
                                        <tr className="border-b last:border-b-0" style={{borderColor: 'var(--bg-divider)'}}>
                                            <td className="p-2 blazin-text">{employee?.first_name} {employee?.last_name}</td>
                                            <td className="p-2 blazin-text">{Array.isArray(shift.position) ? shift.position.join(' / ') : shift.position}</td>
                                            <td className="p-2 text-center" style={{color: 'var(--text-charcoal)', opacity: 0.7}}>
                                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                <span className="text-xs ml-2">({projHours.toFixed(1)}h)</span>
                                            </td>
                                            <td className="p-2 flex gap-2 justify-center">
                                                <Input 
                                                    type="time" 
                                                    value={shift.actual_start_time} 
                                                    onChange={(e) => onDataChange('shifts', shift.id, 'actual_start_time', e.target.value)} 
                                                    className="w-28"
                                                />
                                                <Input 
                                                    type="time" 
                                                    value={shift.actual_end_time} 
                                                    onChange={(e) => onDataChange('shifts', shift.id, 'actual_end_time', e.target.value)}
                                                    className="w-28"
                                                />
                                            </td>
                                        </tr>
                                        {showVarianceReasonInput && (
                                            <tr className="border-b last:border-b-0" style={{borderColor: 'var(--bg-divider)'}}>
                                                <td colSpan="4" className="p-2" style={{backgroundColor: 'var(--bg-module-highlight)'}}>
                                                     <div className="flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                        <label className="text-xs font-semibold blazin-text">Reason for {(variance > 0 ? `+${variance.toFixed(2)}` : variance.toFixed(2))} hr variance:</label>
                                                     </div>
                                                    <Input
                                                        placeholder="e.g., Stayed late for deep clean, left early due to slow traffic..."
                                                        value={shift.variance_reason || ''}
                                                        onChange={(e) => onDataChange('shifts', shift.id, 'variance_reason', e.target.value)}
                                                        className="mt-1 w-full text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            }) : (
                                <tr><td colSpan="4" className="p-8 text-center" style={{color: 'var(--text-charcoal)', opacity: 0.6}}>No shifts to audit.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
             <div className="rounded-b-lg p-4 border-t grid grid-cols-1 gap-4" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" style={{color: 'var(--brand-orange)'}}/>
                        <label className="text-sm font-semibold blazin-text">Reason for Variance</label>
                    </div>
                    <Input 
                        placeholder="e.g., Unexpected rush, slow day, event nearby..."
                        value={reason}
                        onChange={(e) => onReasonChange(day, e.target.value)}
                        className="w-full"
                    />
                </div>
                
                {/* Updated Summary Stats with AM/PM breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t text-center" style={{borderColor: 'var(--text-charcoal)'}}>
                    <div>
                        <div className="text-xs blazin-text-light">Total Hours</div>
                        <div className="font-bold" style={{color: 'var(--brand-orange)'}}>{actualHours.toFixed(1)}</div>
                        <div className="text-xs blazin-text-light opacity-70">Opening: {preOpenHours.toFixed(1)}h | Closing: {postCloseHours.toFixed(1)}h</div>
                    </div>
                    <div>
                        <div className="text-xs blazin-text-light">Total Labor %</div>
                        <div className="font-bold" style={{color: 'var(--brand-orange)'}}>{actualTotalLaborPercent.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div className="text-xs blazin-text-light">AM Labor %</div>
                        <div className="font-bold" style={{color: 'var(--brand-orange)'}}>{actualAmLaborPercent.toFixed(1)}%</div>
                        <div className="text-xs blazin-text-light opacity-70">Proj: {projectedAmLaborPercent.toFixed(1)}%</div>
                    </div>
                    <div>
                        <div className="text-xs blazin-text-light">PM Labor %</div>
                        <div className="font-bold" style={{color: 'var(--brand-orange)'}}>{actualPmLaborPercent.toFixed(1)}%</div>
                        <div className="text-xs blazin-text-light opacity-70">Proj: {projectedPmLaborPercent.toFixed(1)}%</div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
