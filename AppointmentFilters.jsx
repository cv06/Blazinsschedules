import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AppointmentFilters({ onFilterChange }) {
    const [status, setStatus] = React.useState("all");
    const [type, setType] = React.useState("all");
    const [date, setDate] = React.useState("all");

    const handleFilterChange = (filterType, value) => {
        if (filterType === "status") setStatus(value);
        if (filterType === "type") setType(value);
        if (filterType === "date") setDate(value);
        onFilterChange({ 
            status: filterType === "status" ? value : status, 
            type: filterType === "type" ? value : type,
            date: filterType === "date" ? value : date
        });
    };

    return (
        <Card className="mb-6 shadow-sm border-0 bg-white">
            <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Filters:</span>
                    </div>

                    <Select value={status} onValueChange={(value) => handleFilterChange("status", value)}>
                        <SelectTrigger className="w-40 border-slate-200">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={type} onValueChange={(value) => handleFilterChange("type", value)}>
                        <SelectTrigger className="w-40 border-slate-200">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={date} onValueChange={(value) => handleFilterChange("date", value)}>
                        <SelectTrigger className="w-40 border-slate-200">
                            <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Dates</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="tomorrow">Tomorrow</SelectItem>
                            <SelectItem value="this_week">This Week</SelectItem>
                            <SelectItem value="next_week">Next Week</SelectItem>
                            <SelectItem value="this_month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}