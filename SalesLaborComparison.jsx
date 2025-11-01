import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export default function SalesLaborComparison({ yesterdayData, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-48" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" style={{backgroundColor: '#EADED2'}} />
        </CardContent>
      </Card>
    );
  }

  if (!yesterdayData) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
            <BarChart3 className="w-5 h-5" style={{ color: '#E16B2A' }} />
            Yesterday's Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>No data available for yesterday</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const salesVariance = yesterdayData.actualSales - yesterdayData.projectedSales;
  const salesVariancePercent = yesterdayData.projectedSales > 0 
    ? (salesVariance / yesterdayData.projectedSales) * 100 
    : 0;

  const laborVariance = yesterdayData.actualLaborPercent - yesterdayData.projectedLaborPercent;

  const chartData = [
    {
      name: 'Sales',
      projected: yesterdayData.projectedSales,
      actual: yesterdayData.actualSales,
    },
    {
      name: 'Labor %',
      projected: yesterdayData.projectedLaborPercent,
      actual: yesterdayData.actualLaborPercent,
    }
  ];

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <BarChart3 className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Yesterday vs Projected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg border" 
               style={{backgroundColor: '#EADED2', borderColor: '#392F2D'}}>
            <div className="text-lg font-bold" style={{ color: '#392F2D' }}>
              ${yesterdayData.actualSales?.toLocaleString() || '0'}
            </div>
            <div className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>Actual Sales</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {salesVariancePercent >= 0 ? (
                <TrendingUp className="w-3 h-3" style={{ color: '#E16B2A' }} />
              ) : (
                <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
              <span className="text-xs" 
                    style={{ color: salesVariancePercent >= 0 ? '#E16B2A' : '#ef4444' }}>
                {Math.abs(salesVariancePercent).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="text-center p-3 rounded-lg border" 
               style={{backgroundColor: '#EADED2', borderColor: '#392F2D'}}>
            <div className="text-lg font-bold" style={{ color: '#392F2D' }}>
              {yesterdayData.actualLaborPercent?.toFixed(1) || '0'}%
            </div>
            <div className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>Actual Labor %</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {laborVariance <= 0 ? (
                <TrendingDown className="w-3 h-3" style={{ color: '#E16B2A' }} />
              ) : (
                <TrendingUp className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
              <span className="text-xs" 
                    style={{ color: laborVariance <= 0 ? '#E16B2A' : '#ef4444' }}>
                {Math.abs(laborVariance).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                style={{ fontSize: '12px', fill: '#392F2D' }}
              />
              <YAxis hide />
              <Bar dataKey="projected" fill="#EADED2" radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" fill="#E16B2A" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#EADED2' }}></div>
            <span style={{ color: '#392F2D' }}>Projected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#E16B2A' }}></div>
            <span style={{ color: '#392F2D' }}>Actual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}