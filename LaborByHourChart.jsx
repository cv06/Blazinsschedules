import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export default function LaborByHourChart({ data }) {
    const chartData = useMemo(() => {
        if (!data || !data.shifts) return [];
        const { shifts } = data;
        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
            hour: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
            hours: 0,
            cost: 0
        }));

        shifts.forEach(shift => {
            if (shift.start_time && shift.actual_labor_cost) {
                const startHour = parseInt(shift.start_time.split(':')[0]);
                const shiftHours = shift.hours || 0;
                hourlyData[startHour].hours += shiftHours;
                hourlyData[startHour].cost += shift.actual_labor_cost;
            }
        });
        
        // Only return hours that have data (6am to midnight)
        return hourlyData.slice(6, 24).filter(d => d.hours > 0);
    }, [data]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 border rounded-lg" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--bg-divider)'}}>
                    <p className="font-semibold blazin-text">{label}</p>
                    <p className="text-sm" style={{ color: 'var(--brand-orange)' }}>
                        Hours: {payload[0].value.toFixed(1)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-charcoal)' }}>
                        Cost: ${payload[0].payload.cost.toFixed(0)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-divider)" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#392F2D' }} />
                <YAxis tick={{ fontSize: 12, fill: '#392F2D' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-divider)' }}/>
                <Bar dataKey="hours" fill="#E16B2A" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}