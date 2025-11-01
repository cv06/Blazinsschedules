import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, addDays, parse } from 'date-fns';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function DailyPerformanceChart({ data }) {
    const chartData = useMemo(() => {
        if (!data) return [];
        const { schedule, shifts, sales } = data;

        const dailyData = {};
        shifts.forEach(shift => {
            if (!dailyData[shift.date]) {
                dailyData[shift.date] = { laborCost: 0, hours: 0 };
            }
            dailyData[shift.date].laborCost += shift.actual_labor_cost || 0;
            dailyData[shift.date].hours += shift.hours || 0;
        });

        return DAYS_OF_WEEK.map((day, index) => {
            const date = format(addDays(parse(schedule.week_start_date, 'yyyy-MM-dd', new Date()), index), 'yyyy-MM-dd');
            const daySale = sales.find(s => s.day_of_week === day);
            const dayLabor = dailyData[date] || { laborCost: 0 };
            return {
                day: day.substring(0, 3),
                Sales: daySale?.total_daily_sales || 0,
                'Labor Cost': dayLabor.laborCost,
            };
        });
    }, [data]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 border rounded-lg" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--bg-divider)'}}>
                    <p className="font-semibold blazin-text capitalize">{label}</p>
                     {payload.map(p => (
                        <p key={p.dataKey} className="text-sm" style={{ color: p.color }}>
                            {p.dataKey}: ${p.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-divider)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#392F2D' }} />
                <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12, fill: '#392F2D' }} tickFormatter={(val) => `$${(val/1000)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-divider)' }} />
                <Legend wrapperStyle={{color: '#392F2D'}}/>
                <Bar yAxisId="left" dataKey="Sales" fill="#E16B2A" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="Labor Cost" stroke="#392F2D" strokeWidth={2} />
            </ComposedChart>
        </ResponsiveContainer>
    );
}