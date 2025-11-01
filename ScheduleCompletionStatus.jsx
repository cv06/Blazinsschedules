import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ScheduleCompletionStatus({ upcomingSchedules, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-48" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" style={{backgroundColor: '#EADED2'}} />
                  <Skeleton className="h-4 w-12" style={{backgroundColor: '#EADED2'}} />
                </div>
                <Skeleton className="h-2 w-full" style={{backgroundColor: '#EADED2'}} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getCompletionStatus = (percentage) => {
    if (percentage >= 95) return { status: 'complete', color: '#E16B2A', icon: CheckCircle };
    if (percentage >= 70) return { status: 'good', color: '#22c55e', icon: CheckCircle };
    if (percentage >= 40) return { status: 'partial', color: '#f59e0b', icon: AlertCircle };
    return { status: 'incomplete', color: '#ef4444', icon: AlertCircle };
  };

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <Calendar className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Schedule Completion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingSchedules.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>No upcoming schedules</p>
          </div>
        ) : (
          upcomingSchedules.slice(0, 4).map((schedule, index) => {
            const completion = getCompletionStatus(schedule.completionPercentage);
            const Icon = completion.icon;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#392F2D' }}>
                      Week of {format(new Date(schedule.week_start_date + 'T00:00:00'), 'MMM d')}
                    </span>
                    {schedule.is_published && (
                      <Badge style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
                        Published
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: completion.color }} />
                    <span className="text-sm" style={{ color: completion.color }}>
                      {schedule.completionPercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <Progress 
                  value={schedule.completionPercentage} 
                  className="h-2"
                  style={{ 
                    '--progress-background': completion.color,
                    backgroundColor: '#EADED2' 
                  }}
                />
                
                <div className="flex justify-between text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>
                  <span>
                    {schedule.assignedShifts} assigned of {schedule.totalShifts} shifts
                  </span>
                  <span>
                    {schedule.totalShifts - schedule.assignedShifts} remaining
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}