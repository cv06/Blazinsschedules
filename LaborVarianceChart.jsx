import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, ReferenceLine } from 'recharts';

export default function LaborVarianceChart({ data }) {
    const chartData = useMemo(() => {
        if (!data || !data.schedule) return [];
        return [{
            name: 'Labor Cost',
            Projected: data.schedule.total_labor_cost || 0,
            Actual: data.schedule.actual_labor_cost || 0,
        }];
    }, [data]);
    
    const variance = (chartData[0]?.Actual || 0) - (chartData[0]?.Projected || 0);
    const variancePercent = (chartData[0]?.Projected > 0) ? (variance / chartData[0].Projected) * 100 : 0;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="p-3 border rounded-lg" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--bg-divider)'}}>
                    <p className="font-semibold blazin-text">Labor Cost Analysis</p>
                    <p className="text-sm" style={{ color: '#E16B2A' }}>
                        Projected: ${payload[0].value.toLocaleString()}
                    </p>
                    <p className="text-sm" style={{ color: '#392F2D' }}>
                        Actual: ${payload[1].value.toLocaleString()}
                    </p>
                    <p className={`text-sm font-bold mt-1`} style={{color: variance > 0 ? '#E16B2A' : '#392F2D'}}>
                        Variance: ${variance.toLocaleString()} ({variancePercent.toFixed(1)}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-divider)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#392F2D' }} tickFormatter={(val) => `$${(val/1000)}k`}/>
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-divider)' }} />
                <Legend wrapperStyle={{color: '#392F2D'}} />
                <Bar dataKey="Projected" fill="#E16B2A" opacity={0.7} barSize={60} radius={[4, 4, 4, 4]} />
                <Bar dataKey="Actual" fill="#392F2D" barSize={60} radius={[4, 4, 4, 4]} />
            </BarChart>
        </ResponsiveContainer>
    );
}