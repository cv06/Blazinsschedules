import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function PositionDistributionChart({ data }) {
    const chartData = useMemo(() => {
        if (!data || !data.shifts) return [];
        const { shifts } = data;
        const positionCounts = {};

        shifts.forEach(shift => {
            if (shift.position) {
                positionCounts[shift.position] = (positionCounts[shift.position] || 0) + (shift.actual_labor_cost || shift.labor_cost || 0);
            }
        });

        return Object.entries(positionCounts)
            .map(([position, cost]) => ({
                name: position,
                value: cost
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [data]);

    const COLORS = [
        '#E16B2A', '#392F2D', '#de6a2b', '#EADED2',
        '#e68a5a', '#6b5f5d', '#d98c63', '#f0e9e3'
    ];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-3 border rounded-lg" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--bg-divider)'}}>
                    <p className="font-semibold blazin-text">{data.name}</p>
                    <p className="text-sm" style={{ color: 'var(--brand-orange)' }}>
                        Labor Cost: ${data.value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    iconType="circle" 
                    wrapperStyle={{fontSize: "12px", color: '#392F2D'}}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}