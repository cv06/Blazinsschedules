
import React, { useState, useEffect } from "react";
import { TimeOffRequest } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarX, Plus, Save, X, Trash2 } from "lucide-react";
import { format, differenceInDays, addDays, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { formatTime } from "@/components/lib/utils";

export default function TimeOffManager({ employees }) {
    const [requests, setRequests] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [newRequest, setNewRequest] = useState({
        employee_id: "",
        start_date: "",
        end_date: "",
        is_all_day: true,
        start_time: "",
        end_time: "",
        reason: "",
        status: "pending"
    });
    const [isDateRange, setIsDateRange] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        const requestsData = await TimeOffRequest.list("-start_date");
        setRequests(requestsData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const requestData = {
            ...newRequest,
            end_date: isDateRange ? newRequest.end_date : newRequest.start_date
        };
        await TimeOffRequest.create(requestData);
        setShowForm(false);
        setNewRequest({
            employee_id: "",
            start_date: "",
            end_date: "",
            is_all_day: true,
            start_time: "",
            end_time: "",
            reason: "",
            status: "pending"
        });
        setIsDateRange(false);
        loadRequests();
    };

    const updateRequestStatus = async (requestId, status) => {
        const request = requests.find(r => r.id === requestId);
        await TimeOffRequest.update(requestId, { ...request, status });
        loadRequests();
    };

    const deleteRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to delete this time off request?')) {
            await TimeOffRequest.delete(requestId);
            loadRequests();
        }
    };

    const getEmployeeName = (employeeId) => {
        const employee = employees.find(emp => emp.employee_id === employeeId);
        return employee ? `${employee.first_name} ${employee.last_name}` : employeeId;
    };

    const formatDateRange = (startDate, endDate) => {
        // Validate that we have valid dates
        if (!startDate || !endDate) {
            return "Invalid date range";
        }

        try {
            const start = parseISO(startDate + 'T00:00:00');
            const end = parseISO(endDate + 'T00:00:00');
            
            // Check if parsed dates are valid
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return "Invalid date range";
            }
            
            const daysDiff = differenceInDays(end, start);
            
            if (daysDiff === 0) {
                return format(start, "EEEE, MMMM d, yyyy");
            } else if (daysDiff === 1) {
                return `${format(start, "EEE, MMM d")} - ${format(end, "EEE, MMM d, yyyy")}`;
            } else {
                return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")} (${daysDiff + 1} days)`;
            }
        } catch (error) {
            console.error("Error formatting date range:", error);
            return "Invalid date range";
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
                <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                    <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
                            <CalendarX className="w-5 h-5" style={{ color: '#E16B2A' }} />
                            Time Off Requests
                        </CardTitle>
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="font-semibold"
                            style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Request
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-4 rounded-lg"
                                style={{ 
                                  backgroundColor: '#FFF2E2'
                                }}
                            >
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label style={{ color: '#392F2D' }}>Employee</Label>
                                            <Select 
                                                value={newRequest.employee_id} 
                                                onValueChange={(value) => setNewRequest(prev => ({ ...prev, employee_id: value }))}
                                                required
                                            >
                                                <SelectTrigger className="border" style={{ borderColor: '#392F2D', backgroundColor: '#EADED2' }}>
                                                    <SelectValue placeholder="Select employee..." />
                                                </SelectTrigger>
                                                <SelectContent style={{ backgroundColor: '#EADED2' }}>
                                                    {employees.map((employee) => (
                                                        <SelectItem key={employee.id} value={employee.employee_id}>
                                                            {employee.first_name} {employee.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label style={{ color: '#392F2D' }}>Request Type</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id="single-day"
                                                        name="dateType"
                                                        checked={!isDateRange}
                                                        onChange={() => setIsDateRange(false)}
                                                        style={{ accentColor: '#E16B2A' }}
                                                    />
                                                    <Label htmlFor="single-day" style={{ color: '#392F2D' }}>Single Day</Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        id="date-range"
                                                        name="dateType"
                                                        checked={isDateRange}
                                                        onChange={() => setIsDateRange(true)}
                                                        style={{ accentColor: '#E16B2A' }}
                                                    />
                                                    <Label htmlFor="date-range" style={{ color: '#392F2D' }}>Date Range</Label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label style={{ color: '#392F2D' }}>{isDateRange ? 'Start Date' : 'Date'}</Label>
                                            <Input
                                                type="date"
                                                value={newRequest.start_date}
                                                onChange={(e) => setNewRequest(prev => ({ ...prev, start_date: e.target.value }))}
                                                className="border"
                                                style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                                required
                                            />
                                        </div>

                                        {isDateRange && (
                                            <div className="space-y-2">
                                                <Label style={{ color: '#392F2D' }}>End Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newRequest.end_date}
                                                    onChange={(e) => setNewRequest(prev => ({ ...prev, end_date: e.target.value }))}
                                                    className="border"
                                                    style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                                    min={newRequest.start_date}
                                                    required={isDateRange}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={newRequest.is_all_day}
                                            onCheckedChange={(checked) => setNewRequest(prev => ({ ...prev, is_all_day: checked }))}
                                            style={{ 
                                              '--switch-bg': '#E16B2A'
                                            }}
                                        />
                                        <Label style={{ color: '#392F2D' }}>All Day{isDateRange ? 's' : ''}</Label>
                                    </div>

                                    {!newRequest.is_all_day && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label style={{ color: '#392F2D' }}>Start Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newRequest.start_time}
                                                    onChange={(e) => setNewRequest(prev => ({ ...prev, start_time: e.target.value }))}
                                                    className="border"
                                                    style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label style={{ color: '#392F2D' }}>End Time</Label>
                                                <Input
                                                    type="time"
                                                    value={newRequest.end_time}
                                                    onChange={(e) => setNewRequest(prev => ({ ...prev, end_time: e.target.value }))}
                                                    className="border"
                                                    style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label style={{ color: '#392F2D' }}>Reason</Label>
                                        <Textarea
                                            value={newRequest.reason}
                                            onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                                            className="border"
                                            style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                            placeholder="Reason for time off..."
                                            required
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setShowForm(false);
                                                setIsDateRange(false);
                                            }}
                                            className="border"
                                            style={{ 
                                              borderColor: '#392F2D', 
                                              backgroundColor: 'transparent',
                                              color: '#392F2D'
                                            }}
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="font-semibold"
                                            style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Add Request
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarX className="w-12 h-12 mx-auto mb-3" style={{ color: '#EADED2' }} />
                                <p style={{ color: '#392F2D', opacity: 0.75 }}>No time off requests</p>
                            </div>
                        ) : (
                            requests.map((request) => (
                                <div key={request.id} className="p-4 rounded-lg" 
                                     style={{ backgroundColor: '#FFF2E2' }}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold" style={{ color: '#392F2D' }}>
                                                    {getEmployeeName(request.employee_id)}
                                                </h3>
                                                <Badge className="border" 
                                                       style={{ 
                                                         borderColor: '#392F2D', 
                                                         backgroundColor: '#EADED2',
                                                         color: '#392F2D'
                                                       }}>
                                                    {request.status}
                                                </Badge>
                                            </div>
                                            <p style={{ color: '#392F2D' }}>
                                                {formatDateRange(request.start_date, request.end_date)}
                                                {!request.is_all_day && request.start_time && request.end_time && (
                                                    <span className="ml-2">
                                                        ({formatTime(request.start_time)} - {formatTime(request.end_time)})
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.75 }}>{request.reason}</p>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {request.status === "pending" && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateRequestStatus(request.id, "approved")}
                                                        className="border font-semibold"
                                                        style={{ 
                                                          borderColor: '#E16B2A', 
                                                          backgroundColor: 'transparent',
                                                          color: '#E16B2A'
                                                        }}
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateRequestStatus(request.id, "denied")}
                                                        className="border font-semibold"
                                                        style={{ 
                                                          borderColor: '#392F2D', 
                                                          backgroundColor: 'transparent',
                                                          color: '#392F2D'
                                                        }}
                                                    >
                                                        Deny
                                                    </Button>
                                                </>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteRequest(request.id)}
                                                className="border font-semibold"
                                                style={{ 
                                                  borderColor: '#E16B2A', 
                                                  backgroundColor: 'transparent',
                                                  color: '#E16B2A'
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
