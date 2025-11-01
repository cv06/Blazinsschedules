
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { formatTime } from '@/components/lib/utils';

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours + minutes / 60;
};

export default function AssignShiftPopover({ employee, date, unassignedShifts, onShiftsChange }) {
    const [open, setOpen] = React.useState(false);

    const handleAssign = (shift) => {
        onShiftsChange({ ...shift, employee_id: employee.employee_id });
        setOpen(false);
    };

    if (unassignedShifts.length === 0) {
        return (
            <div className="text-center pt-2">
                <p className="text-xs blazin-text-light opacity-50">No available shifts</p>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-2 gap-2 text-xs blazin-text hover:bg-black/5">
                    <PlusCircle className="w-4 h-4" /> Assign Shift
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-center mb-2 blazin-text">Available Shifts</p>
                    {unassignedShifts.sort((a,b) => timeToDecimal(a.start_time) - timeToDecimal(b.start_time)).map(shift => (
                        <Button
                            key={shift.id}
                            variant="ghost"
                            className="w-full justify-start h-auto py-2 hover:bg-black/5"
                            onClick={() => handleAssign(shift)}
                        >
                            <div className="flex flex-col items-start">
                                <span className="blazin-text text-sm font-semibold">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span>
                                <span className="blazin-text-light text-xs">{(shift.position || []).join(', ')}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
