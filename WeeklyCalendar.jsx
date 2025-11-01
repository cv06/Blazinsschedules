import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  scheduled: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-orange-500"
};

export default function WeeklyCalendar({ appointments, isLoading }) {
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => 
      isSameDay(new Date(apt.start_datetime), day)
    ).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Calendar className="w-5 h-5 text-slate-600" />
          This Week's Schedule
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
              {Array(21).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div 
                  key={day.toISOString()}
                  className={`text-center p-2 rounded-lg ${
                    isToday(day) ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-lg font-bold">
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                return (
                  <div key={day.toISOString()} className="min-h-32">
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-2 rounded text-xs text-white ${statusColors[appointment.status]}`}
                        >
                          <div className="font-medium truncate">
                            {appointment.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(appointment.start_datetime), 'h:mm a')}</span>
                          </div>
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-slate-500 text-center p-1">
                          +{dayAppointments.length - 3} more
                        </div>
                      )}
                    </div>
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