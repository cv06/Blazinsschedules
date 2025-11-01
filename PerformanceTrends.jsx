import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default function PerformanceTrends({ recentSchedules, targetLaborPercentage, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-40" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" style={{backgroundColor: '#EADED2'}} />
        </CardContent>
      </Card>
    );
  }

  if (recentSchedules.length === 0) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#E16B2A' }} />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>No trend data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = recentSchedules
    .slice(0, 6)
    .reverse()
    .map(schedule => ({
      week: format(new Date(schedule.week_start_date + 'T00:00:00'), 'M/d'),
      laborPercentage: schedule.labor_percentage || 0,
      actualLaborPercentage: schedule.actual_labor_percentage || null
    }));

  const target = targetLaborPercentage || 25;

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <TrendingUp className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Labor % Trends (6 weeks)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '12px', fill: '#392F2D' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '12px', fill: '#392F2D' }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <ReferenceLine 
                y={target} 
                stroke="#E16B2A" 
                strokeDasharray="5 5" 
                label={{ value: `Target ${target}%`, position: 'topRight', style: { fill: '#E16B2A', fontSize: '12px' } }}
              />
              <Line 
                type="monotone" 
                dataKey="laborPercentage" 
                stroke="#392F2D" 
                strokeWidth={2}
                dot={{ fill: '#392F2D', strokeWidth: 2, r: 4 }}
                name="Projected"
              />
              <Line 
                type="monotone" 
                dataKey="actualLaborPercentage" 
                stroke="#E16B2A" 
                strokeWidth={2}
                dot={{ fill: '#E16B2A', strokeWidth: 2, r: 4 }}
                connectNulls={false}
                name="Actual"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#392F2D' }}></div>
            <span style={{ color: '#392F2D' }}>Projected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E16B2A' }}></div>
            <span style={{ color: '#392F2D' }}>Actual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}