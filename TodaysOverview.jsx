import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TodaysOverview({ todaysShifts, employees, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-32" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" style={{backgroundColor: '#EADED2'}} />
            <Skeleton className="h-4 w-3/4" style={{backgroundColor: '#EADED2'}} />
            <Skeleton className="h-4 w-1/2" style={{backgroundColor: '#EADED2'}} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const assignedShifts = todaysShifts.filter(shift => shift.employee_id);
  const unassignedShifts = todaysShifts.filter(shift => !shift.employee_id);
  const uniqueEmployeesWorking = [...new Set(assignedShifts.map(shift => shift.employee_id))];
  
  const coverageGaps = unassignedShifts.length;
  const coverageStatus = coverageGaps === 0 ? 'complete' : coverageGaps <= 2 ? 'warning' : 'critical';

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <Calendar className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Today's Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg border" style={{backgroundColor: '#EADED2', borderColor: '#392F2D'}}>
            <div className="text-2xl font-bold" style={{ color: '#392F2D' }}>{assignedShifts.length}</div>
            <div className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>Scheduled Shifts</div>
          </div>
          <div className="text-center p-3 rounded-lg border" style={{backgroundColor: '#EADED2', borderColor: '#392F2D'}}>
            <div className="text-2xl font-bold" style={{ color: '#392F2D' }}>{uniqueEmployeesWorking.length}</div>
            <div className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>Staff Working</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-medium" style={{ color: '#392F2D' }}>Coverage Status</span>
          <Badge 
            className="flex items-center gap-1"
            style={{
              backgroundColor: coverageStatus === 'complete' ? '#E16B2A' : coverageStatus === 'warning' ? '#f59e0b' : '#ef4444',
              color: '#FFF2E2'
            }}
          >
            {coverageStatus === 'complete' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {coverageStatus === 'complete' ? 'Fully Covered' : `${coverageGaps} Gap${coverageGaps > 1 ? 's' : ''}`}
          </Badge>
        </div>

        {assignedShifts.length > 0 && (
          <div>
            <h4 className="font-medium mb-2" style={{ color: '#392F2D' }}>Today's Team</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uniqueEmployeesWorking.map(employeeId => {
                const employee = employees.find(e => e.employee_id === employeeId);
                const employeeShifts = assignedShifts.filter(s => s.employee_id === employeeId);
                return (
                  <div key={employeeId} className="flex justify-between items-center text-sm">
                    <span style={{ color: '#392F2D' }}>
                      {employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown'}
                    </span>
                    <span style={{ color: '#392F2D', opacity: 0.7 }}>
                      {employeeShifts[0]?.start_time} - {employeeShifts[employeeShifts.length-1]?.end_time}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}