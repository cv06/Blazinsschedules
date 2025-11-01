
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandList, CommandItem } from "@/components/ui/command";
import { User, X, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, parse } from 'date-fns'; // Added 'parse'

const timeToDecimal = (timeStr) => {
  if (!timeStr) return null;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  } catch {
    return null;
  }
};

const getAvailabilityStatus = (employee, shift, availability, timeOff, allShiftsForWeek) => {
    if (!employee || !shift) return { text: 'Select Employee', color: 'text-gray-500', isAvailable: true, suggestionScore: 0 };

    // Use parse for more robust date parsing
    const dayOfWeek = format(parse(shift.date, "yyyy-MM-dd", new Date()), 'eeee').toLowerCase();
    const employeeAvailability = availability.find(a => a.employee_id === employee.employee_id && a.day_of_week === dayOfWeek);

    // 1. Check Approved Time Off
    const timeOffForDay = timeOff.find(t => t.employee_id === employee.employee_id && isSameDay(new Date(t.start_date + "T00:00:00"), new Date(shift.date + "T00:00:00")));
    if (timeOffForDay) {
        return { text: 'Time Off', color: 'text-brand-orange', isAvailable: false, suggestionScore: -100 };
    }

    // 2. Check General Availability
    if (!employeeAvailability || !employeeAvailability.is_available) {
        return { text: 'Unavailable', color: 'text-brand-orange', isAvailable: false, suggestionScore: -100 };
    }
    
    // 3. Check Position - Updated logic for "Team Member" and stricter requirements
    const shiftPositions = shift.position || [];
    const employeePositions = new Set(employee.positions || []);
    let positionConflict = false;

    // Special case: "Team Member" is a universal position that doesn't cause a conflict.
    // If the shift requires positions AND is not solely 'Team Member', then check if employee has ALL required positions.
    if (shiftPositions.length > 0 && !shiftPositions.includes('Team Member')) {
        positionConflict = !shiftPositions.every(p => employeePositions.has(p));
    }
    
    if (positionConflict) {
        return { text: 'Wrong Position', color: 'text-brand-orange', isAvailable: false, suggestionScore: -100 };
    }

    // 4. Check Time Conflict
    const shiftStart = timeToDecimal(shift.start_time);
    const shiftEnd = timeToDecimal(shift.end_time);
    const availStart = timeToDecimal(employeeAvailability.start_time);
    const availEnd = timeToDecimal(employeeAvailability.end_time);

    if (shiftStart < availStart || shiftEnd > availEnd) {
        return { text: 'Time Conflict', color: 'text-brand-orange', isAvailable: false, suggestionScore: -100 };
    }
    
    // 5. Check for Overlapping Shifts
    const overlappingShift = allShiftsForWeek
        .filter(s => s.date === shift.date && s.employee_id === employee.employee_id && s.id !== shift.id)
        .find(otherShift => {
            const otherStart = timeToDecimal(otherShift.start_time);
            const otherEnd = timeToDecimal(otherShift.end_time);
            return Math.max(shiftStart, otherStart) < Math.min(shiftEnd, otherEnd);
        });

    if (overlappingShift) {
        return { text: 'Overlapping', color: 'text-brand-orange', isAvailable: false, suggestionScore: -100 };
    }
    
    // If available, calculate suggestion score (simple version)
    const totalHoursForWeek = allShiftsForWeek
        .filter(s => s.employee_id === employee.employee_id)
        .reduce((sum, s) => sum + (s.hours || 0), 0);
    const score = 100 - totalHoursForWeek; // Prioritize employees with fewer hours

    return { text: 'Available', color: 'text-charcoal', isAvailable: true, suggestionScore: score };
};


export default function EmployeeSelector({ selectedEmployee, onSelect, shift, allData }) {
    const { employees, availability, timeOff, shifts: allShiftsForWeek } = allData;
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const processedEmployees = React.useMemo(() => {
        if (!allData || !employees) return [];

        return employees
            .filter(e => e.is_active)
            .map(employee => ({
                employee,
                status: getAvailabilityStatus(employee, shift, availability, timeOff, allShiftsForWeek)
            }));
            
    }, [employees, shift, availability, timeOff, allShiftsForWeek]);

    const suggested = processedEmployees
        .filter(e => e.status.isAvailable)
        .sort((a, b) => b.status.suggestionScore - a.status.suggestionScore)
        .slice(0, 5); // Top 5 suggestions
        
    const otherAvailable = processedEmployees
        .filter(e => e.status.isAvailable && !suggested.find(s => s.employee.id === e.employee.id));
        
    const unavailable = processedEmployees.filter(e => !e.status.isAvailable);


    const selectedEmployeeStatus = React.useMemo(() => {
        if (!selectedEmployee) return { text: 'Select Employee', color: 'text-gray-500' };
        return getAvailabilityStatus(selectedEmployee, shift, availability, timeOff, allShiftsForWeek);
    }, [selectedEmployee, shift, availability, timeOff, allShiftsForWeek]);

    const renderEmployeeItem = (employeeData) => (
        <CommandItem
            key={employeeData.employee.id}
            value={`${employeeData.employee.first_name} ${employeeData.employee.last_name}`}
            onSelect={() => {
                onSelect(employeeData.employee);
                setIsOpen(false);
            }}
            className="flex justify-between items-center"
        >
            <span className="blazin-text">{employeeData.employee.first_name} {employeeData.employee.last_name}</span>
            <span className={`text-xs font-bold ${employeeData.status.color}`}>{employeeData.status.text}</span>
        </CommandItem>
    );
    
    if (selectedEmployee) {
        return (
            <div className="flex items-center gap-2 py-1 w-full justify-between">
                <div className="flex flex-col flex-1">
                    <span className="font-semibold blazin-text">{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
                    <span className={`text-xs font-bold ${selectedEmployeeStatus.color}`}>
                        {selectedEmployeeStatus.text}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-transparent" onClick={() => onSelect(null)}>
                    <X className="w-4 h-4" style={{color: 'var(--brand-orange)'}} />
                </Button>
            </div>
        )
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isOpen}
                    className="w-full justify-between blazin-text"
                    style={{backgroundColor: 'var(--bg-divider)'}}
                >
                    Select Employee...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" style={{backgroundColor: 'var(--bg-module)', zIndex: 100}}>
                <Command>
                    <CommandInput 
                        placeholder="Search employee..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        {suggested.length > 0 && <CommandGroup heading="Suggested">{suggested.map(renderEmployeeItem)}</CommandGroup>}
                        {otherAvailable.length > 0 && <CommandGroup heading="Other Available">{otherAvailable.map(renderEmployeeItem)}</CommandGroup>}
                        {unavailable.length > 0 && <CommandGroup heading="Unavailable">{unavailable.map(renderEmployeeItem)}</CommandGroup>}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
