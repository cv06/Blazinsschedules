import React from 'react';
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200"
};

export default function UpcomingAppointments({ appointments, isLoading }) {
  const upcomingAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(apt.start_datetime);
      return aptDate >= new Date() && isThisWeek(aptDate);
    })
    .slice(0, 8);

  const getDateLabel = (date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="text-xl font-bold text-slate-900">Upcoming This Week</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-2 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming appointments this week</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="relative pl-6">
                  <div className={`absolute left-0 top-0 w-2 h-full rounded-full ${
                    isToday(new Date(appointment.start_datetime)) ? 'bg-amber-400' :
                    isTomorrow(new Date(appointment.start_datetime)) ? 'bg-blue-400' :
                    'bg-slate-300'
                  }`} />
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-slate-900">{appointment.title}</h4>
                      <Badge 
                        variant="secondary"
                        className={`${statusColors[appointment.status]} text-xs`}
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{getDateLabel(new Date(appointment.start_datetime))}</span>
                      <span>•</span>
                      <span>{format(new Date(appointment.start_datetime), "h:mm a")}</span>
                    </div>
                    
                    {appointment.client_name && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4" />
                        <span>{appointment.client_name}</span>
                      </div>
                    )}
                    
                    {appointment.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{appointment.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}