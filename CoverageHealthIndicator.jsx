import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function CoverageHealthIndicator({ upcomingWeeks, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-40" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" style={{backgroundColor: '#EADED2'}} />
                <Skeleton className="h-2 w-full" style={{backgroundColor: '#EADED2'}} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = (percentage) => {
    if (percentage >= 90) return { status: 'excellent', color: '#E16B2A', icon: CheckCircle };
    if (percentage >= 75) return { status: 'good', color: '#22c55e', icon: CheckCircle };
    if (percentage >= 50) return { status: 'warning', color: '#f59e0b', icon: AlertTriangle };
    return { status: 'critical', color: '#ef4444', icon: AlertTriangle };
  };

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <Shield className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Coverage Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingWeeks.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>No upcoming schedules</p>
          </div>
        ) : (
          upcomingWeeks.slice(0, 4).map((week, index) => {
            const health = getHealthStatus(week.coveragePercentage);
            const Icon = health.icon;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#392F2D' }}>
                    Week of {format(new Date(week.week_start_date + 'T00:00:00'), 'MMM d')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: health.color }} />
                    <span className="text-sm" style={{ color: health.color }}>
                      {week.coveragePercentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={week.coveragePercentage} 
                  className="h-2"
                  style={{ 
                    '--progress-background': health.color,
                    backgroundColor: '#EADED2' 
                  }}
                />
                <div className="flex justify-between text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>
                  <span>{week.assignedShifts} of {week.totalShifts} shifts covered</span>
                  <span>{week.totalShifts - week.assignedShifts} gaps</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}