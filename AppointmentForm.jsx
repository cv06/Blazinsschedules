import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function AppointmentForm({ appointment, onSubmit, onCancel }) {
    const [currentAppointment, setCurrentAppointment] = React.useState(appointment || {
        title: "",
        description: "",
        client_name: "",
        client_email: "",
        client_phone: "",
        start_datetime: "",
        end_datetime: "",
        location: "",
        status: "scheduled",
        appointment_type: "meeting",
        notes: "",
        priority: "medium"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(currentAppointment);
    };

    const handleInputChange = (field, value) => {
        setCurrentAppointment(prev => ({ ...prev, [field]: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
        >
            <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-slate-600" />
                        {appointment ? 'Edit Appointment' : 'New Appointment'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Appointment Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="Meeting with..."
                                    value={currentAppointment.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client_name">Client Name</Label>
                                <Input
                                    id="client_name"
                                    placeholder="John Doe"
                                    value={currentAppointment.client_name}
                                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="client_email">Client Email</Label>
                                <Input
                                    id="client_email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={currentAppointment.client_email}
                                    onChange={(e) => handleInputChange('client_email', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client_phone">Client Phone</Label>
                                <Input
                                    id="client_phone"
                                    placeholder="(555) 123-4567"
                                    value={currentAppointment.client_phone}
                                    onChange={(e) => handleInputChange('client_phone', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="start_datetime">Start Date & Time *</Label>
                                <Input
                                    id="start_datetime"
                                    type="datetime-local"
                                    value={currentAppointment.start_datetime}
                                    onChange={(e) => handleInputChange('start_datetime', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_datetime">End Date & Time *</Label>
                                <Input
                                    id="end_datetime"
                                    type="datetime-local"
                                    value={currentAppointment.end_datetime}
                                    onChange={(e) => handleInputChange('end_datetime', e.target.value)}
                                    className="border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                placeholder="123 Main St, City, State"
                                value={currentAppointment.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                className="border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="appointment_type">Type</Label>
                                <Select
                                    value={currentAppointment.appointment_type}
                                    onValueChange={(value) => handleInputChange('appointment_type', value)}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="consultation">Consultation</SelectItem>
                                        <SelectItem value="meeting">Meeting</SelectItem>
                                        <SelectItem value="service">Service</SelectItem>
                                        <SelectItem value="interview">Interview</SelectItem>
                                        <SelectItem value="presentation">Presentation</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={currentAppointment.status}
                                    onValueChange={(value) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="no_show">No Show</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={currentAppointment.priority}
                                    onValueChange={(value) => handleInputChange('priority', value)}
                                >
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Appointment details..."
                                value={currentAppointment.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="h-24 border-slate-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                placeholder="Additional notes..."
                                value={currentAppointment.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                className="h-20 border-slate-200"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                                <Save className="w-4 h-4 mr-2" />
                                {appointment ? 'Update' : 'Create'} Appointment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}