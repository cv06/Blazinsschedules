import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const statusColors = {
    scheduled: "bg-blue-500",
    confirmed: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
    no_show: "bg-orange-500"
};

export default function CalendarView({ appointments, filters, onEdit, onStatusChange }) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const filteredAppointments = appointments.filter(appointment => {
        const statusMatch = filters.status === "all" || appointment.status === filters.status;
        const typeMatch = filters.type === "all" || appointment.appointment_type === filters.type;
        return statusMatch && typeMatch;
    });

    const getAppointmentsForDay = (day) => {
        return filteredAppointments.filter(apt => 
            isSameDay(new Date(apt.start_datetime), day)
        ).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
    };

    const renderCalendarDays = () => {
        const days = [];
        let day = startDate;

        while (day <= endDate) {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            days.push(
                <div 
                    key={day.toString()}
                    className={`min-h-32 p-2 border border-slate-100 ${
                        !isCurrentMonth ? 'bg-slate-50 text-slate-400' : 'bg-white'
                    } ${isCurrentDay ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                    <div className={`text-sm font-medium mb-2 ${
                        isCurrentDay ? 'text-blue-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                        {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((appointment) => (
                            <div
                                key={appointment.id}
                                className={`p-1 rounded text-xs text-white cursor-pointer hover:opacity-80 ${statusColors[appointment.status]}`}
                                onClick={() => onEdit(appointment)}
                            >
                                <div className="font-medium truncate">
                                    {format(new Date(appointment.start_datetime), 'h:mm a')}
                                </div>
                                <div className="truncate">
                                    {appointment.title}
                                </div>
                            </div>
                        ))}
                        {dayAppointments.length > 3 && (
                            <div className="text-xs text-slate-500 text-center">
                                +{dayAppointments.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }

        return days;
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const today = () => {
        setCurrentMonth(new Date());
    };

    return (
        <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={today}>
                            Today
                        </Button>
                        <div className="flex">
                            <Button variant="outline" size="icon" onClick={previousMonth}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-7 gap-0">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-3 text-center font-medium text-slate-600 bg-slate-50 border-b border-slate-100">
                            {day}
                        </div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </CardContent>
        </Card>
    );
}