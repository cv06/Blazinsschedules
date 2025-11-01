import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ShiftReminders({ todaysShifts, tomorrowsShifts, employees, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-32" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" style={{backgroundColor: '#EADED2'}} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';
  };

  const todaysAssignedShifts = todaysShifts.filter(shift => shift.employee_id);
  const tomorrowsAssignedShifts = tomorrowsShifts.filter(shift => shift.employee_id);

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <Bell className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Shift Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Shifts */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm" style={{ color: '#392F2D' }}>Today</h4>
            <Badge style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
              {todaysAssignedShifts.length}
            </Badge>
          </div>
          {todaysAssignedShifts.length === 0 ? (
            <p className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>No shifts scheduled</p>
          ) : (
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {todaysAssignedShifts.slice(0, 4).map((shift, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded border"
                     style={{ backgroundColor: '#EADED2', borderColor: '#392F2D' }}>
                  <span style={{ color: '#392F2D' }}>{getEmployeeName(shift.employee_id)}</span>
                  <div className="flex items-center gap-1" style={{ color: '#392F2D', opacity: 0.7 }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{shift.start_time}</span>
                  </div>
                </div>
              ))}
              {todaysAssignedShifts.length > 4 && (
                <p className="text-xs text-center" style={{ color: '#392F2D', opacity: 0.7 }}>
                  +{todaysAssignedShifts.length - 4} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tomorrow's Shifts */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm" style={{ color: '#392F2D' }}>Tomorrow</h4>
            <Badge 
              style={{ backgroundColor: '#392F2D', color: '#FFF2E2' }}
            >
              {tomorrowsAssignedShifts.length}
            </Badge>
          </div>
          {tomorrowsAssignedShifts.length === 0 ? (
            <p className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>No shifts scheduled</p>
          ) : (
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {tomorrowsAssignedShifts.slice(0, 4).map((shift, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 rounded border"
                     style={{ backgroundColor: '#EADED2', borderColor: '#392F2D' }}>
                  <span style={{ color: '#392F2D' }}>{getEmployeeName(shift.employee_id)}</span>
                  <div className="flex items-center gap-1" style={{ color: '#392F2D', opacity: 0.7 }}>
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{shift.start_time}</span>
                  </div>
                </div>
              ))}
              {tomorrowsAssignedShifts.length > 4 && (
                <p className="text-xs text-center" style={{ color: '#392F2D', opacity: 0.7 }}>
                  +{tomorrowsAssignedShifts.length - 4} more
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}