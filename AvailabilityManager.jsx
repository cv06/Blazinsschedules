
import React, { useState, useEffect, useCallback } from "react";
import { Availability } from "@/api/entities";
import { Employee } from "@/api/entities"; // Added Employee entity import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, Save, ChevronDown, CalendarCheck2 } from "lucide-react"; // Added CalendarCheck2 icon

const DAYS_OF_WEEK = [
    { id: 'monday', name: 'Monday' },
    { id: 'tuesday', name: 'Tuesday' },
    { id: 'wednesday', name: 'Wednesday' },
    { id: 'thursday', name: 'Thursday' },
    { id: 'friday', name: 'Friday' },
    { id: 'saturday', name: 'Saturday' },
    { id: 'sunday', name: 'Sunday' }
];

// Utility function to introduce a delay
const delay = ms => new Promise(res => setTimeout(res, ms));

export default function AvailabilityManager({ employees, selectedEmployee, onSelectEmployee, onDataChange }) {
    const [availability, setAvailability] = useState({});
    const [preferences, setPreferences] = useState({
        min_hours: null,
        max_hours: null,
        min_days: null,
        max_days: null
    });
    const [isLoading, setIsLoading] = useState(false);

    const loadAvailability = useCallback(async () => {
        if (!selectedEmployee) return;
        
        setIsLoading(true);
        // Filter by current user to ensure data isolation
        const availabilityData = await Availability.filter({ 
            employee_id: selectedEmployee.employee_id 
            // Note: Availability should be filtered by created_by in the backend or 
            // we need to ensure availability records have created_by field
        });
        
        const availabilityMap = {};
        DAYS_OF_WEEK.forEach(day => {
            const dayData = availabilityData.find(a => a.day_of_week === day.id);
            availabilityMap[day.id] = dayData || {
                employee_id: selectedEmployee.employee_id,
                day_of_week: day.id,
                is_available: false,
                start_time: "09:00",
                end_time: "17:00"
            };
        });
        
        setAvailability(availabilityMap);
        setPreferences({
            min_hours: selectedEmployee.min_hours || null,
            max_hours: selectedEmployee.max_hours || null,
            min_days: selectedEmployee.min_days || null,
            max_days: selectedEmployee.max_days || null,
        });
        setIsLoading(false);
    }, [selectedEmployee]);

    useEffect(() => {
        if (selectedEmployee) {
            loadAvailability();
        }
    }, [selectedEmployee, loadAvailability]);

    const updateAvailability = async (dayId, field, value) => {
        const updatedDay = { ...availability[dayId], [field]: value };
        setAvailability(prev => ({ ...prev, [dayId]: updatedDay }));
    };
    
    const handlePreferenceChange = (field, value) => {
        setPreferences(prev => ({ ...prev, [field]: value ? Number(value) : null }));
    };

    const saveAllPreferences = async () => {
        if (!selectedEmployee) return;

        setIsLoading(true);
        
        // 1. Save weekly preferences to Employee entity
        await Employee.update(selectedEmployee.id, {
            ...selectedEmployee,
            ...preferences
        });
        await delay(50); // Add a small delay

        // 2. Fetch all existing availability for the user at once to reduce reads
        const existingAvailabilities = await Availability.filter({ 
            employee_id: selectedEmployee.employee_id 
        });
        const existingMap = new Map(existingAvailabilities.map(a => [a.day_of_week, a]));

        // 3. Loop through and create/update with delays
        for (const dayData of Object.values(availability)) {
            const existing = existingMap.get(dayData.day_of_week);
            if (existing) {
                await Availability.update(existing.id, dayData);
            } else {
                await Availability.create(dayData);
            }
            await delay(50); // Add delay within the loop to prevent rate limiting
        }
        
        setIsLoading(false);
        onDataChange(); // Notify parent that data has changed
    };

    return (
        <div className="space-y-6">
            <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
                <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                    <CardTitle className="flex items-center gap-2 blazin-text">
                        <CalendarCheck2 className="w-5 h-5" style={{ color: '#E16B2A' }} />
                        Employee Availability & Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div>
                            <Label className="blazin-text font-medium mb-2 block">Select Employee</Label>
                            <Select 
                                value={selectedEmployee?.id || ""} 
                                onValueChange={(value) => onSelectEmployee(employees.find(emp => emp.id === value))}
                            >
                                <SelectTrigger 
                                    className="border rounded-lg h-12"
                                    style={{
                                        backgroundColor: '#FFF2E2',
                                        borderColor: '#392F2D'
                                    }}
                                >
                                    <SelectValue 
                                        placeholder="Choose an employee..." 
                                        className="blazin-text"
                                    />
                                    <ChevronDown className="h-4 w-4 opacity-50" style={{ color: '#E16B2A' }} />
                                </SelectTrigger>
                                <SelectContent 
                                    className="border rounded-lg"
                                    style={{
                                        backgroundColor: '#FFF2E2',
                                        borderColor: '#392F2D'
                                    }}
                                >
                                    {employees.map((employee) => (
                                        <SelectItem 
                                            key={employee.id} 
                                            value={employee.id}
                                            className="blazin-text hover:bg-black/5 rounded-md mx-1 my-0.5 cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3 py-1">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                    style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                                                >
                                                    {employee.first_name[0]}{employee.last_name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium blazin-text">{employee.first_name} {employee.last_name}</div>
                                                    <div className="text-xs blazin-text-light">ID: {employee.employee_id}</div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedEmployee && (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#FFF2E2' }}>
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                                        style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                                    >
                                        {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                                    </div>
                                    <div>
                                        <span className="font-semibold blazin-text text-lg">
                                            {selectedEmployee.first_name} {selectedEmployee.last_name}
                                        </span>
                                        <div className="text-sm blazin-text-light">
                                            Setting availability schedule
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF2E2' }}>
                                    <h3 className="text-lg font-semibold blazin-text mb-4">Weekly Work Preferences</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                       <div className="space-y-2">
                                           <Label htmlFor="min_hours" className="blazin-text font-medium">Min Hours/Wk</Label>
                                           <Input
                                               id="min_hours"
                                               type="number"
                                               placeholder="e.g., 20"
                                               value={preferences.min_hours || ""}
                                               onChange={(e) => handlePreferenceChange('min_hours', e.target.value)}
                                               className="border" style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <Label htmlFor="max_hours" className="blazin-text font-medium">Max Hours/Wk</Label>
                                           <Input
                                               id="max_hours"
                                               type="number"
                                               placeholder="e.g., 35"
                                               value={preferences.max_hours || ""}
                                               onChange={(e) => handlePreferenceChange('max_hours', e.target.value)}
                                               className="border" style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <Label htmlFor="min_days" className="blazin-text font-medium">Min Days/Wk</Label>
                                           <Input
                                               id="min_days"
                                               type="number"
                                               placeholder="e.g., 3"
                                               value={preferences.min_days || ""}
                                               onChange={(e) => handlePreferenceChange('min_days', e.target.value)}
                                               className="border" style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <Label htmlFor="max_days" className="blazin-text font-medium">Max Days/Wk</Label>
                                           <Input
                                               id="max_days"
                                               type="number"
                                               placeholder="e.g., 5"
                                               value={preferences.max_days || ""}
                                               onChange={(e) => handlePreferenceChange('max_days', e.target.value)}
                                               className="border" style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                           />
                                       </div>
                                   </div>
                               </div>


                                <div className="space-y-3">
                                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF2E2' }}>
                                      <h3 className="text-lg font-semibold blazin-text mb-4">Daily Availability</h3>
                                      {DAYS_OF_WEEK.map((day) => (
                                          <div key={day.id} className="flex flex-wrap items-center gap-4 p-3 rounded-lg mb-2" style={{ backgroundColor: '#EADED2' }}>
                                              <div className="w-full sm:w-24 flex-shrink-0 mb-2 sm:mb-0">
                                                  <Label className="font-semibold blazin-text text-base">{day.name}</Label>
                                              </div>
                                              
                                              <div className="flex items-center gap-3">
                                                  <Switch
                                                      checked={availability[day.id]?.is_available || false}
                                                      onCheckedChange={(checked) => updateAvailability(day.id, 'is_available', checked)}
                                                      className="data-[state=checked]:bg-[#E16B2A] data-[state=unchecked]:bg-[#FFF2E2]"
                                                  />
                                                  <Label className="blazin-text font-medium">Available</Label>
                                              </div>

                                              {availability[day.id]?.is_available && (
                                                  <div className="flex items-center gap-3 flex-1 flex-wrap">
                                                      <Input
                                                          type="time"
                                                          value={availability[day.id]?.start_time || "09:00"}
                                                          onChange={(e) => updateAvailability(day.id, 'start_time', e.target.value)}
                                                          className="w-36 border rounded-md"
                                                          style={{borderColor: '#392F2D', backgroundColor: '#FFF2E2'}}
                                                      />
                                                      <span className="blazin-text font-medium">to</span>
                                                      <Input
                                                          type="time"
                                                          value={availability[day.id]?.end_time || "17:00"}
                                                          onChange={(e) => updateAvailability(day.id, 'end_time', e.target.value)}
                                                          className="w-36 border rounded-md"
                                                          style={{borderColor: '#392F2D', backgroundColor: '#FFF2E2'}}
                                                      />
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <Button
                                        onClick={saveAllPreferences}
                                        disabled={isLoading}
                                        className="px-6 py-3 rounded-lg font-semibold"
                                        style={{ 
                                            backgroundColor: '#E16B2A',
                                            color: '#FFF2E2'
                                        }}
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        {isLoading ? 'Saving...' : 'Save Availability'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
