import React, { useState, useEffect } from "react";
import { Appointment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import AppointmentForm from "../components/schedule/AppointmentForm";
import AppointmentFilters from "../components/schedule/AppointmentFilters";
import AppointmentList from "../components/schedule/AppointmentList";
import CalendarView from "../components/schedule/CalendarView";

export default function Schedule() {
    const [appointments, setAppointments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [filters, setFilters] = useState({ status: "all", type: "all", date: "all" });
    const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        const fetchedAppointments = await Appointment.list("-start_datetime");
        setAppointments(fetchedAppointments);
    };

    const handleSubmit = async (appointmentData) => {
        if (editingAppointment) {
            await Appointment.update(editingAppointment.id, appointmentData);
        } else {
            await Appointment.create(appointmentData);
        }
        setShowForm(false);
        setEditingAppointment(null);
        loadAppointments();
    };

    const handleEdit = (appointment) => {
        setEditingAppointment(appointment);
        setShowForm(true);
    };

    const handleDelete = async (appointment) => {
        await Appointment.delete(appointment.id);
        loadAppointments();
    };

    const handleStatusChange = async (appointment, newStatus) => {
        await Appointment.update(appointment.id, { ...appointment, status: newStatus });
        loadAppointments();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Schedule Management</h1>
                        <p className="text-slate-600 mt-1">Create and manage your appointments</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="flex rounded-lg bg-white border border-slate-200 p-1">
                            <Button
                                variant={viewMode === "list" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("list")}
                                className={viewMode === "list" ? "bg-slate-900" : ""}
                            >
                                List
                            </Button>
                            <Button
                                variant={viewMode === "calendar" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("calendar")}
                                className={viewMode === "calendar" ? "bg-slate-900" : ""}
                            >
                                Calendar
                            </Button>
                        </div>
                        <Button 
                            onClick={() => setShowForm(!showForm)}
                            className="bg-slate-900 hover:bg-slate-800"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Appointment
                        </Button>
                    </div>
                </div>

                <AnimatePresence>
                    {showForm && (
                        <AppointmentForm
                            appointment={editingAppointment}
                            onSubmit={handleSubmit}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingAppointment(null);
                            }}
                        />
                    )}
                </AnimatePresence>

                <AppointmentFilters onFilterChange={setFilters} />

                {viewMode === "list" ? (
                    <AppointmentList
                        appointments={appointments}
                        filters={filters}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <CalendarView
                        appointments={appointments}
                        filters={filters}
                        onEdit={handleEdit}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </div>
        </div>
    );
}