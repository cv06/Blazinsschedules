import React from 'react';
import { format, addDays, startOfWeek } from "date-fns";
import { Flame, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function WeeklyFlameChart({ salesProjections, isLoading }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDaySales = (dayIndex) => {
    const dayName = format(weekDays[dayIndex], 'EEEE').toLowerCase();
    const dayData = salesProjections.find(proj => proj.day_of_week === dayName);
    return dayData?.total_daily_sales || 0;
  };

  const maxSales = Math.max(...weekDays.map((_, i) => getDaySales(i)), 1);

  return (
    <div className="p-6 rounded-lg border h-full" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
          <Flame className="w-6 h-6" style={{ color: '#E16B2A' }} />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#392F2D' }}>This Week's Heat Map</h2>
          <p style={{ color: '#392F2D', opacity: 0.7 }}>Sales projections at a glance</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-between items-end h-56">
          {Array(7).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2 flex-1">
              <Skeleton className="w-3/4 rounded-t-lg" style={{ height: `${Math.random() * 150 + 40}px`, backgroundColor: '#EADED2' }} />
              <Skeleton className="h-4 w-10" style={{backgroundColor: '#EADED2'}}/>
            </div>
          ))}
        </div>
      ) : salesProjections.length === 0 ? (
        <div className="text-center py-16">
          <Flame className="w-12 h-12 mx-auto mb-4" style={{ color: '#392F2D', opacity: 0.2 }} />
          <p style={{ color: '#392F2D', opacity: 0.7 }}>No sales projections for this week.</p>
        </div>
      ) : (
        <div className="flex justify-between items-end h-56">
          {weekDays.map((day, index) => {
            const daySales = getDaySales(index);
            const height = maxSales > 0 ? Math.max((daySales / maxSales) * 180, 10) : 10;
            const opacity = maxSales > 0 ? Math.max((daySales / maxSales) * 0.8 + 0.2, 0.2) : 0.2;
            
            return (
              <div key={day.toISOString()} className="flex flex-col items-center space-y-2 group cursor-pointer flex-1 text-center">
                <div 
                  className="relative w-3/4 rounded-t-lg transition-all duration-300 group-hover:scale-y-105"
                  style={{ 
                    height: height,
                    backgroundColor: '#E16B2A',
                    opacity: opacity,
                  }}
                >
                  <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${daySales.toLocaleString()}
                  </div>
                </div>
                <div className={`text-sm font-bold`} style={{ color: '#392F2D' }}>
                  {format(day, 'EEE')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}