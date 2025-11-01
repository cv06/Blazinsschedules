import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function LaborPerformanceAlerts({ recentSchedules, targetLaborPercentage, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <CardHeader>
          <Skeleton className="h-6 w-40" style={{backgroundColor: '#EADED2'}} />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" style={{backgroundColor: '#EADED2'}} />
        </CardContent>
      </Card>
    );
  }

  const alerts = [];
  const target = targetLaborPercentage || 25;

  // Check current week labor
  const currentWeek = recentSchedules[0];
  if (currentWeek && currentWeek.labor_percentage) {
    const variance = currentWeek.labor_percentage - target;
    if (Math.abs(variance) > 2) {
      alerts.push({
        type: variance > 0 ? 'over' : 'under',
        message: `Current week labor ${variance > 0 ? 'above' : 'below'} target`,
        value: `${currentWeek.labor_percentage.toFixed(1)}% vs ${target}% target`,
        severity: Math.abs(variance) > 5 ? 'high' : 'medium'
      });
    }
  }

  // Check trend
  if (recentSchedules.length >= 3) {
    const last3 = recentSchedules.slice(0, 3);
    const trend = last3[0]?.labor_percentage - last3[2]?.labor_percentage;
    if (Math.abs(trend) > 3) {
      alerts.push({
        type: trend > 0 ? 'trending_up' : 'trending_down',
        message: `Labor % trending ${trend > 0 ? 'upward' : 'downward'}`,
        value: `${Math.abs(trend).toFixed(1)}% change over 3 weeks`,
        severity: 'medium'
      });
    }
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'over': return <TrendingUp className="w-4 h-4" />;
      case 'under': return <TrendingDown className="w-4 h-4" />;
      case 'trending_up': return <TrendingUp className="w-4 h-4" />;
      case 'trending_down': return <TrendingDown className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#E16B2A';
    }
  };

  return (
    <Card className="border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
          <Target className="w-5 h-5" style={{ color: '#E16B2A' }} />
          Labor Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" 
                 style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
              ✓
            </div>
            <p className="text-sm" style={{ color: '#392F2D' }}>On target</p>
            <p className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>Labor performance is within target range</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border" 
                   style={{ backgroundColor: '#EADED2', borderColor: '#392F2D' }}>
                <div style={{ color: getAlertColor(alert.severity) }}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: '#392F2D' }}>
                      {alert.message}
                    </span>
                    <Badge 
                      style={{ 
                        backgroundColor: getAlertColor(alert.severity), 
                        color: '#FFF2E2',
                        fontSize: '10px' 
                      }}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#392F2D', opacity: 0.7 }}>
                    {alert.value}
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