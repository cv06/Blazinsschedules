
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, UserPlus, TrendingUp, CalendarDays, Briefcase } from 'lucide-react';

const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
    } catch {
        return 0;
    }
};

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function HiringSuggestions({ allData }) {
    const { employees, performaShifts, availability, sales, settings } = allData;

    const suggestions = useMemo(() => {
        if (!settings || !sales.length || !performaShifts.length) {
            return { dailyGaps: [], weeklyGaps: [], message: "Insufficient data for hiring analysis. Please complete sales projections and performa schedules." };
        }

        const laborTarget = settings.target_labor_percentage / 100;
        const dailyGaps = [];
        const weeklyGaps = [];

        // --- Daily Analysis ---
        for (const day of DAYS_OF_WEEK) {
            const daySales = sales.find(s => s.day_of_week === day);
            if (!daySales || !daySales.total_daily_sales) continue;

            const requiredLaborSpend = daySales.total_daily_sales * laborTarget;
            
            // Calculate total available hours from current staff on this day
            let totalAvailableHours = 0;
            const activeEmployees = employees.filter(e => e.is_active);
            
            // Calculate total available hours considering weekly max_hours
            const employeeWeeklyHours = {};
            activeEmployees.forEach(emp => {
                const availForDay = availability.find(a => a.employee_id === emp.employee_id && a.day_of_week === day);
                if (availForDay && availForDay.is_available) {
                    if (!employeeWeeklyHours[emp.employee_id]) {
                        employeeWeeklyHours[emp.employee_id] = { total: 0, max: emp.max_hours || Infinity };
                    }
                    const dayDuration = Math.max(0, timeToDecimal(availForDay.end_time) - timeToDecimal(availForDay.start_time));
                    
                    // Add hours only if they don't exceed the weekly max
                    const potentialNewTotal = employeeWeeklyHours[emp.employee_id].total + dayDuration;
                    if (potentialNewTotal <= employeeWeeklyHours[emp.employee_id].max) {
                        employeeWeeklyHours[emp.employee_id].total += dayDuration;
                        totalAvailableHours += dayDuration;
                    } else {
                        // Add only the remaining available hours up to the max
                        const remainingHours = employeeWeeklyHours[emp.employee_id].max - employeeWeeklyHours[emp.employee_id].total;
                        if (remainingHours > 0) {
                            totalAvailableHours += remainingHours;
                            employeeWeeklyHours[emp.employee_id].total += remainingHours;
                        }
                    }
                }
            });

            // Calculate total required hours from performa
            const performaForDay = performaShifts.filter(s => {
                const shiftDate = new Date(s.date + 'T00:00:00'); // Ensure date is parsed correctly, T00:00:00 for local timezone
                const shiftDay = shiftDate.toLocaleString('en-us', {  weekday: 'long' }).toLowerCase();
                return shiftDay === day;
            });
            const requiredShiftHours = performaForDay.reduce((sum, s) => sum + (s.hours || 0), 0);

            // A simplified "available spend" vs "required spend"
            const avgWage = employees.length > 0 ? employees.reduce((sum, e) => sum + (e.hourly_rate || 15), 0) / employees.length : 15;
            const availableLaborSpend = totalAvailableHours * avgWage;
            const requiredPerformaSpend = requiredShiftHours * avgWage;

            const spendDeficit = requiredPerformaSpend - availableLaborSpend;

            if (spendDeficit > 50) { // If we're short by more than ~$50 in labor...
                dailyGaps.push({
                    day: day.charAt(0).toUpperCase() + day.slice(1),
                    details: `There is a significant gap between scheduled performa hours and the available hours from your current team.`,
                    suggestion: `Consider hiring for ${day.charAt(0).toUpperCase() + day.slice(1)} shifts to cover approximately ${Math.round(spendDeficit / avgWage)} more hours.`
                });
            }
        }
        
        // --- Weekly Analysis ---
        const totalWeeklyRequiredHours = performaShifts.reduce((sum, s) => sum + (s.hours || 0), 0);

        const activeEmployees = employees.filter(e => e.is_active); // Filter once for all weekly analyses

        let totalWeeklyAvailableHours = 0;
        activeEmployees.forEach(emp => {
            const employeeWeeklyAvailability = availability
                .filter(a => a.employee_id === emp.employee_id && a.is_available)
                .reduce((total, a) => total + Math.max(0, timeToDecimal(a.end_time) - timeToDecimal(a.start_time)), 0);
            
            const maxHours = emp.max_hours || Infinity;
            totalWeeklyAvailableHours += Math.min(employeeWeeklyAvailability, maxHours);
        });
        
        if (totalWeeklyRequiredHours > totalWeeklyAvailableHours + 10) { // Threshold of 10 hours
            weeklyGaps.push({
                type: 'Overall Labor', // Changed type
                Icon: CalendarDays, // Added Icon
                suggestion: `Your schedule requires ${Math.round(totalWeeklyRequiredHours)} total hours, but your team's maximum availability is ~${Math.round(totalWeeklyAvailableHours)} hours. Consider hiring to cover the ${Math.round(totalWeeklyRequiredHours - totalWeeklyAvailableHours)}-hour weekly deficit.`
            });
        }
        
        // --- Positional Weekly Analysis ---
        // Collect all unique positions from performa shifts
        const allPositions = [...new Set(performaShifts.flatMap(s => s.position ? [s.position] : []))];

        for (const position of allPositions) {
            // Skip generic "Team Member" role if it doesn't represent a specific skill.
            if (position === 'Team Member') continue;

            const requiredPosHours = performaShifts
                .filter(s => s.position === position) // Filter shifts for this specific position
                .reduce((sum, s) => sum + (s.hours || 0), 0);
            
            let availablePosHours = 0;
            // Employees who can work this position
            const employeesForPos = activeEmployees.filter(e => e.positions && e.positions.includes(position));

            employeesForPos.forEach(emp => {
                const employeeWeeklyAvailability = availability
                    .filter(a => a.employee_id === emp.employee_id && a.is_available)
                    .reduce((total, a) => total + Math.max(0, timeToDecimal(a.end_time) - timeToDecimal(a.start_time)), 0);
                
                const maxHours = emp.max_hours || Infinity;
                availablePosHours += Math.min(employeeWeeklyAvailability, maxHours);
            });

            if (requiredPosHours > availablePosHours + 5) { // Threshold of 5 hours for positional gaps
                 weeklyGaps.push({
                    type: `${position} Shortage`,
                    Icon: Briefcase,
                    suggestion: `You have a weekly deficit of ~${Math.round(requiredPosHours - availablePosHours)} hours for the '${position}' role. Consider hiring another ${position}.`
                });
            }
        }


        if (dailyGaps.length === 0 && weeklyGaps.length === 0){
             return { dailyGaps: [], weeklyGaps: [], message: "Your current team's availability appears sufficient to cover your projected performa needs." };
        }

        return { dailyGaps, weeklyGaps, message: null };
    }, [employees, performaShifts, availability, sales, settings]);

    return (
        <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
            <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                <CardTitle className="flex items-center gap-2 blazin-text">
                    <Lightbulb className="w-5 h-5" style={{ color: '#E16B2A' }} />
                    Strategic Hiring Suggestions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {suggestions.dailyGaps.length === 0 && suggestions.weeklyGaps.length === 0 ? (
                    <div className="text-center py-4">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{color: 'var(--brand-orange)'}}/>
                        <p className="font-semibold blazin-text">No Structural Gaps Detected</p>
                        <p className="text-sm blazin-text-light">{suggestions.message}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                         {suggestions.weeklyGaps.map((gap, index) => (
                            <div key={`weekly-${index}`} className="p-4 rounded-lg" style={{ backgroundColor: '#FFF2E2' }}>
                                <div className="flex items-center gap-3">
                                    {gap.Icon && <gap.Icon className="w-6 h-6 flex-shrink-0" style={{color: 'var(--brand-orange)'}}/>}
                                    <div>
                                        <h4 className="font-bold blazin-text">{gap.type}</h4>
                                        <p className="text-sm font-semibold blazin-text mt-1">{gap.suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {suggestions.dailyGaps.map((gap, index) => (
                            <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: '#FFF2E2' }}>
                                <div className="flex items-center gap-3">
                                    <UserPlus className="w-6 h-6 flex-shrink-0" style={{color: 'var(--brand-orange)'}}/>
                                    <div>
                                        <h4 className="font-bold blazin-text">{gap.day} Coverage Gap</h4>
                                        <p className="text-sm blazin-text-light">{gap.details}</p>
                                        <p className="text-sm font-semibold blazin-text mt-1">{gap.suggestion}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
