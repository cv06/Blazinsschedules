import React from 'react';
import { format, addDays, startOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeekOverview({ salesProjections, isLoading }) {
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDaySales = (dayIndex) => {
    const dayName = format(weekDays[dayIndex], 'EEEE').toLowerCase();
    const dayData = salesProjections.find(proj => proj.day_of_week === dayName);
    return dayData?.total_daily_sales || 0;
  };

  const totalWeekSales = salesProjections.reduce((sum, day) => sum + (day.total_daily_sales || 0), 0);

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b border-orange-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold blazin-text">
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--blazin-orange)' }} />
          This Week's Sales Projections
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {Array(7).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-8 rounded" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array(7).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day, index) => (
                <div 
                  key={day.toISOString()}
                  className="text-center p-2 rounded-lg bg-orange-50"
                >
                  <div className="text-xs font-medium blazin-text opacity-75">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-lg font-bold blazin-text">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-6">
              {weekDays.map((day, index) => {
                const daySales = getDaySales(index);
                return (
                  <div key={day.toISOString()} className="text-center">
                    <div className="bg-orange-100 rounded-lg p-3 mb-2">
                      <DollarSign className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--blazin-orange)' }} />
                      <div className="text-sm font-semibold blazin-text">
                        ${daySales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--blazin-cream)' }}>
              <div className="text-sm blazin-text opacity-75 mb-1">Total Week Projection</div>
              <div className="text-2xl font-bold blazin-text">${totalWeekSales.toLocaleString()}</div>
              <Badge 
                variant="outline" 
                className="mt-2 border-orange-200 text-orange-800"
              >
                Average: ${Math.round(totalWeekSales / 7).toLocaleString()} per day
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}