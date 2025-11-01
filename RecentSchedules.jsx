import React from 'react';
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecentSchedules({ schedules, isLoading }) {
  const recentSchedules = schedules.slice(0, 5);

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: '#392F2D' }}>
        <Sparkles className="w-5 h-5" style={{ color: '#E16B2A' }} />
        Recent Schedules
      </h3>

      <div className="space-y-3">
        {isLoading ? (
          <>
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" style={{backgroundColor: '#EADED2'}} />)}
          </>
        ) : recentSchedules.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#392F2D', opacity: 0.5 }} />
            <p style={{ color: '#392F2D', opacity: 0.7 }}>No schedules created yet</p>
          </div>
        ) : (
          recentSchedules.map((schedule) => (
            <div key={schedule.id} className="p-3 rounded-lg border hover:bg-black/5 transition-colors cursor-pointer" style={{borderColor: '#EADED2'}}>
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold" style={{ color: '#392F2D' }}>
                  {schedule.schedule_name || `Week of ${format(new Date(schedule.week_start_date), 'MMM d')}`}
                </h4>
                <Badge
                  className={`text-xs rounded-full border`}
                  style={schedule.is_published 
                    ? { backgroundColor: '#E16B2A', color: '#FFF2E2', borderColor: '#E16B2A' }
                    : { backgroundColor: '#EADED2', color: '#392F2D', borderColor: '#392F2D' }
                  }
                >
                  {schedule.is_published ? 'Live' : 'Draft'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(schedule.week_start_date), "MMM d")}</span>
                </div>
                {schedule.labor_percentage && (
                  <div className="flex items-center gap-1">
                    <span>{schedule.labor_percentage.toFixed(1)}% labor</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}