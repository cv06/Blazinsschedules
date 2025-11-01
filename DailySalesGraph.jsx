import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function WeeklySalesGraph({ projections, weekStartDate }) {
  // Build complete dataset with all dayparts across the week
  const chartData = [];
  
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    const projection = projections.find(p => p.day_of_week === day);
    const dayAbbrev = day.substring(0, 3).toUpperCase();
    
    chartData.push(
      { name: `${dayAbbrev} L`, value: projection?.lunch_sales || 0, day: dayAbbrev },
      { name: `${dayAbbrev} M`, value: projection?.midday_sales || 0, day: dayAbbrev },
      { name: `${dayAbbrev} D`, value: projection?.dinner_sales || 0, day: dayAbbrev },
      { name: `${dayAbbrev} N`, value: projection?.late_night_sales || 0, day: dayAbbrev }
    );
  });

  const maxValue = Math.max(...chartData.map(d => d.value));
  const hasData = maxValue > 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
          <p className="font-semibold text-sm mb-1" style={{ color: '#392F2D' }}>
            {data.name}
          </p>
          <p className="text-lg font-bold" style={{ color: '#E16B2A' }}>
            ${payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = ({ x, y, payload }) => {
    const data = chartData[payload.index];
    if (!data) return null;
    
    // Only show day label on the first daypart of each day (Lunch)
    const isFirstDaypart = payload.value.endsWith(' L');
    
    return (
      <g transform={`translate(${x},${y})`}>
        {isFirstDaypart && (
          <text 
            x={0} 
            y={0} 
            dy={16} 
            textAnchor="middle" 
            fill="#392F2D" 
            fontSize={12}
            fontWeight="bold"
          >
            {data.day}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full">
      {hasData ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EADED2" />
            <XAxis 
              dataKey="name" 
              tick={<CustomXAxisTick />}
              axisLine={{ stroke: '#392F2D' }}
              tickLine={false}
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#392F2D' }}
              axisLine={{ stroke: '#392F2D' }}
              tickLine={{ stroke: '#392F2D' }}
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#E16B2A" 
              strokeWidth={3}
              dot={{ fill: '#E16B2A', r: 4 }}
              activeDot={{ r: 6, fill: '#E16B2A', strokeWidth: 2, stroke: '#FFF2E2' }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-lg" style={{ color: '#392F2D', opacity: 0.5 }}>No sales data to display</p>
        </div>
      )}
    </div>
  );
}