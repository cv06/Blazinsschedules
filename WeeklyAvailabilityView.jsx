
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfWeek, addDays } from 'date-fns';
import { Eye, Lightbulb, Clock, Calendar } from 'lucide-react';
import HiringSuggestions from './HiringSuggestions';

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours + minutes / 60;
    } catch {
        return 0;
    }
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? 'p' : 'a';
    const adjustedHour = ((hour + 11) % 12 + 1);
    return `${adjustedHour}${m === '00' ? '' : `:${m}`}${suffix}`;
};

export default function WeeklyAvailabilityView({ allData }) {
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const { employees, availability, settings } = allData;

    const availabilityMatrix = useMemo(() => {
        if (!settings) return [];

        // Store open/close times are no longer used for AM/PM split in this view.
        // The display now shows the employee's total availability for the day.

        const activeEmployees = employees.filter(e => e.is_active).sort((a,b) => a.first_name.localeCompare(b.first_name));
        
        return activeEmployees.map(emp => {
            const empAvail = DAYS_OF_WEEK.map(day => { // Changed from flatMap to map
                const dayStr = day.toLowerCase();
                const avail = availability.find(a => a.employee_id === emp.employee_id && a.day_of_week === dayStr);

                if (!avail || !avail.is_available) {
                    return "Unavailable"; // Returns a single availability string per day
                }

                // Return the full available time range for the day
                return `${formatTime(avail.start_time)} - ${formatTime(avail.end_time)}`;
            });

            return {
                ...emp, // Spread existing employee properties
                name: `${emp.first_name} ${emp.last_name}`,
                availability: empAvail // This array now contains 7 elements (one for each day)
            };
        });
    }, [employees, availability, settings]); // Dependencies are still correct

    if (!settings || !settings.open_time || !settings.midday_end_time || !settings.close_time) {
        return (
            <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
                <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                    <CardTitle className="flex items-center gap-2 blazin-text">
                        <Eye className="w-5 h-5" style={{ color: '#E16B2A' }} />
                        Team Availability Matrix
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center blazin-text">
                    Store settings (Open Time, Midday End Time, Close Time) must be configured to view team availability.
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
                <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                    <CardTitle className="flex items-center gap-2 blazin-text">
                        <Eye className="w-5 h-5" style={{ color: '#E16B2A' }} />
                        Team Availability Matrix
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" style={{minWidth: '1200px'}}>
                            <thead>
                                <tr>
                                    <th className="p-3 text-left font-semibold blazin-text border-b-2" style={{borderColor: '#E16B2A'}}>Employee</th>
                                    <th className="p-3 text-center font-semibold blazin-text border-b-2" style={{borderColor: '#E16B2A'}}>
                                        <div className="flex items-center justify-center gap-1"><Clock className="w-4 h-4" /> Hrs</div>
                                    </th>
                                    <th className="p-3 text-center font-semibold blazin-text border-b-2" style={{borderColor: '#E16B2A'}}>
                                       <div className="flex items-center justify-center gap-1"><Calendar className="w-4 h-4" /> Days</div>
                                    </th>
                                    {DAYS_OF_WEEK.map(day => (
                                        <th key={day} className="p-3 text-center font-semibold blazin-text border-b-2" style={{borderColor: '#E16B2A'}}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {availabilityMatrix.map((emp, idx) => {
                                    const isDarkRow = idx % 2 !== 0;
                                    const rowBg = isDarkRow ? '#EADED2' : '#FFF2E2';
                                    const cellBg = isDarkRow ? '#FFF2E2' : '#EADED2';

                                    return (
                                        <tr key={idx} style={{ backgroundColor: rowBg }}>
                                            <td className="p-3 font-medium blazin-text">{emp.name}</td>
                                            <td className="p-3 text-center">
                                                <div className="rounded-md px-2 py-1 inline-block" style={{backgroundColor: cellBg}}>
                                                    <span className="text-sm font-semibold blazin-text">
                                                        {emp.min_hours || '–'} / {emp.max_hours || '–'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="rounded-md px-2 py-1 inline-block" style={{backgroundColor: cellBg}}>
                                                    <span className="text-sm font-semibold blazin-text">
                                                        {emp.min_days || '–'} / {emp.max_days || '–'}
                                                    </span>
                                                </div>
                                            </td>
                                            {emp.availability.map((avail, dayIdx) => (
                                                <td key={dayIdx} className="p-3 text-center">
                                                    <div className="rounded-md px-2 py-1 inline-block" style={{backgroundColor: cellBg}}>
                                                        <span className={`text-xs ${avail === 'Unavailable' ? 'blazin-text-light' : 'font-semibold blazin-text'}`}>
                                                            {avail}
                                                        </span>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <HiringSuggestions allData={allData} />
        </div>
    );
}
