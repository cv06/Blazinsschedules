import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Calendar, Clock, User, CheckCircle } from 'lucide-react';

export default function AvailabilityAlerts({ conflicts, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton key="1" className="h-10 w-full" style={{backgroundColor: '#EADED2'}} />
            <Skeleton key="2" className="h-10 w-full" style={{backgroundColor: '#EADED2'}} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <AlertTriangle className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Availability Alerts
          {conflicts.length > 0 && (
            <Badge 
              className="ml-2"
              style={{ backgroundColor: '#ef4444', color: '#FFF2E2' }}
            >
              {conflicts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conflicts.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--brand-orange)' }} />
            <p className="font-semibold" style={{ color: '#392F2D' }}>No Conflicts Found</p>
            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>All scheduled shifts align with employee availability.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="p-3 rounded-lg border" style={{ backgroundColor: '#EADED2', borderColor: '#392F2D' }}>
                <div className="font-semibold flex items-center gap-2" style={{ color: '#392F2D' }}>
                  <User className="w-4 h-4" />
                  {conflict.employeeName}
                </div>
                <div className="text-sm mt-2 space-y-1 pl-6">
                  <p className="flex items-center gap-2"><Calendar className="w-3 h-3"/> {conflict.shiftDate} ({conflict.shiftTime})</p>
                  <p className="flex items-center gap-2"><Clock className="w-3 h-3"/> <span className="font-medium text-red-600">{conflict.reason}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}