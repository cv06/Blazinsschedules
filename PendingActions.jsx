import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, Clock, UserX, Calendar } from 'lucide-react';

export default function PendingActions({ 
  pendingTimeOffRequests, 
  unassignedShifts, 
  employeesWithoutAvailability,
  incompleteFutureSchedules,
  isLoading 
}) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-32" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{backgroundColor: '#EADED2'}} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const actions = [];

  if (pendingTimeOffRequests > 0) {
    actions.push({
      icon: <Clock className="w-4 h-4" />,
      title: 'Time Off Requests',
      count: pendingTimeOffRequests,
      description: 'Pending approval',
      priority: 'high'
    });
  }

  if (unassignedShifts > 0) {
    actions.push({
      icon: <Calendar className="w-4 h-4" />,
      title: 'Unassigned Shifts',
      count: unassignedShifts,
      description: 'Need employee assignment',
      priority: 'high'
    });
  }

  if (employeesWithoutAvailability > 0) {
    actions.push({
      icon: <UserX className="w-4 h-4" />,
      title: 'Missing Availability',
      count: employeesWithoutAvailability,
      description: 'Employees need to set availability',
      priority: 'medium'
    });
  }

  if (incompleteFutureSchedules > 0) {
    actions.push({
      icon: <CheckSquare className="w-4 h-4" />,
      title: 'Incomplete Schedules',
      count: incompleteFutureSchedules,
      description: 'Future weeks need completion',
      priority: 'medium'
    });
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#E16B2A';
    }
  };

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <CheckSquare className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Pending Actions
          {actions.length > 0 && (
            <Badge 
              style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
            >
              {actions.reduce((sum, action) => sum + action.count, 0)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" 
                 style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
              ✓
            </div>
            <p className="text-sm" style={{ color: '#392F2D' }}>All caught up!</p>
            <p className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>No pending actions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-black/5 transition-colors" 
                   style={{ backgroundColor: '#EADED2', borderColor: '#392F2D' }}>
                <div style={{ color: getPriorityColor(action.priority) }}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: '#392F2D' }}>
                      {action.title}
                    </span>
                    <Badge 
                      style={{ 
                        backgroundColor: getPriorityColor(action.priority), 
                        color: '#FFF2E2' 
                      }}
                    >
                      {action.count}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#392F2D', opacity: 0.7 }}>
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}