import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isTomorrow, isThisWeek, isNextWeek, isThisMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, MapPin, User, Phone, Mail, MoreVertical, Edit, Trash2 } from "lucide-react";

const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    confirmed: "bg-green-100 text-green-800 border-green-200",
    completed: "bg-gray-100 text-gray-800 border-gray-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    no_show: "bg-orange-100 text-orange-800 border-orange-200"
};

const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800"
};

export default function AppointmentList({ appointments, filters, onEdit, onDelete, onStatusChange }) {
    const filteredAppointments = appointments.filter(appointment => {
        const statusMatch = filters.status === "all" || appointment.status === filters.status;
        const typeMatch = filters.type === "all" || appointment.appointment_type === filters.type;
        
        let dateMatch = true;
        if (filters.date !== "all") {
            const aptDate = new Date(appointment.start_datetime);
            switch (filters.date) {
                case "today":
                    dateMatch = isToday(aptDate);
                    break;
                case "tomorrow":
                    dateMatch = isTomorrow(aptDate);
                    break;
                case "this_week":
                    dateMatch = isThisWeek(aptDate);
                    break;
                case "next_week":
                    dateMatch = isNextWeek(aptDate);
                    break;
                case "this_month":
                    dateMatch = isThisMonth(aptDate);
                    break;
            }
        }
        
        return statusMatch && typeMatch && dateMatch;
    });

    if (filteredAppointments.length === 0) {
        return (
            <Card className="p-12 text-center shadow-lg border-0 bg-white">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No appointments found</h3>
                <p className="text-slate-500">Try adjusting your filters or create a new appointment</p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {filteredAppointments.map((appointment) => (
                    <motion.div
                        key={appointment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-6 shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-slate-900">{appointment.title}</h3>
                                        <Badge className={`${statusColors[appointment.status]} border`}>
                                            {appointment.status}
                                        </Badge>
                                        <Badge className={`${priorityColors[appointment.priority]}`}>
                                            {appointment.priority} priority
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Clock className="w-4 h-4" />
                                                <span>
                                                    {format(new Date(appointment.start_datetime), "EEEE, MMMM d, yyyy")}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 ml-6">
                                                <span>
                                                    {format(new Date(appointment.start_datetime), "h:mm a")} - {format(new Date(appointment.end_datetime), "h:mm a")}
                                                </span>
                                            </div>
                                            {appointment.location && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="truncate">{appointment.location}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {appointment.client_name && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <User className="w-4 h-4" />
                                                    <span>{appointment.client_name}</span>
                                                </div>
                                            )}
                                            {appointment.client_email && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="truncate">{appointment.client_email}</span>
                                                </div>
                                            )}
                                            {appointment.client_phone && (
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Phone className="w-4 h-4" />
                                                    <span>{appointment.client_phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {appointment.description && (
                                        <p className="text-slate-600 mt-3 text-sm">{appointment.description}</p>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(appointment)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onStatusChange(appointment, "confirmed")}
                                            disabled={appointment.status === "confirmed"}
                                        >
                                            Mark as Confirmed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onStatusChange(appointment, "completed")}
                                            disabled={appointment.status === "completed"}
                                        >
                                            Mark as Completed
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                            onClick={() => onDelete(appointment)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}