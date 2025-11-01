
import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const PositionMultiSelect = ({ positions, selectedPositions, onPositionToggle }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center h-10 px-3 rounded-lg"
                style={{backgroundColor: 'var(--bg-divider)'}}
            >
                <span className="truncate pr-2 text-sm font-semibold blazin-text">
                    {selectedPositions.length === 0 ? "Select Position(s)" : selectedPositions.join(' / ')}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 blazin-text ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div 
                    className="absolute z-20 w-full mt-1 border rounded-lg"
                    style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)' }}
                >
                    {positions.map((pos) => {
                        const isSelected = selectedPositions.includes(pos.name);
                        return (
                            <div
                                key={pos.id}
                                className="flex items-center gap-3 p-2 cursor-pointer hover:bg-black/10"
                                onClick={() => onPositionToggle(pos.name)}
                            >
                                <div className={`w-4 h-4 border rounded flex items-center justify-center`} style={{borderColor: 'var(--text-charcoal)', backgroundColor: isSelected ? 'var(--text-charcoal)' : 'transparent'}}>
                                    {isSelected && <Check className="w-3 h-3" style={{color: 'var(--bg-divider)'}} />}
                                </div>
                                <span className="font-medium text-sm blazin-text">{pos.name}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


export default function AddShiftPopover({ period, onShiftCreate, date, scheduleId, positions }) {
    const [isOpen, setIsOpen] = useState(false);
    const [newShift, setNewShift] = useState({
        start_time: period === 'am' ? '09:00' : '17:00',
        end_time: period === 'am' ? '17:00' : '22:00',
        position: []
    });

    const timeToDecimal = (time) => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours + minutes / 60;
    };

    const handleSave = async () => {
        const hours = Math.max(0, timeToDecimal(newShift.end_time) - timeToDecimal(newShift.start_time));
        const shiftData = {
            ...newShift,
            schedule_id: scheduleId,
            date: format(date, "yyyy-MM-dd"),
            hours: parseFloat(hours.toFixed(2)),
            shift_type: period === 'am' ? 'lunch' : 'dinner'
        };
        await onShiftCreate(shiftData);
        setIsOpen(false);
        setNewShift({
            start_time: period === 'am' ? '09:00' : '17:00',
            end_time: period === 'am' ? '17:00' : '22:00',
            position: []
        });
    };

    const handleTimeChange = (field, value) => {
        setNewShift(prev => ({ ...prev, [field]: value }));
    };

    const handlePositionToggle = (positionName) => {
        setNewShift(prev => {
            const currentPositions = prev.position || [];
            const newPositions = currentPositions.includes(positionName)
                ? currentPositions.filter(p => p !== positionName)
                : [...currentPositions, positionName];
            return { ...prev, position: newPositions };
        });
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="default" size="sm" className="w-full h-8 blazin-text hover:opacity-90" style={{backgroundColor: 'var(--text-charcoal)', color: 'var(--bg-module)'}}>
                    <Plus className="w-4 h-4 mr-1" /> Add Shift
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                <div className="space-y-4">
                    <h4 className="font-medium leading-none blazin-text">Add New Shift</h4>
                    <div className="space-y-2">
                        <label className="text-sm font-medium blazin-text">Time</label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="time"
                                value={newShift.start_time}
                                onChange={(e) => handleTimeChange('start_time', e.target.value)}
                                className="h-10"
                                style={{backgroundColor: 'var(--brand-orange)', border: 'none', color: 'var(--bg-module)', colorScheme: 'dark'}}
                            />
                            <span className="blazin-text-light">-</span>
                            <Input
                                type="time"
                                value={newShift.end_time}
                                onChange={(e) => handleTimeChange('end_time', e.target.value)}
                                className="h-10"
                                style={{backgroundColor: 'var(--brand-orange)', border: 'none', color: 'var(--bg-module)', colorScheme: 'dark'}}
                            />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium blazin-text">Positions</label>
                        <PositionMultiSelect positions={positions} selectedPositions={newShift.position} onPositionToggle={handlePositionToggle} />
                    </div>
                    <Button onClick={handleSave} disabled={newShift.position.length === 0} className="w-full" style={{backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)'}}>Add Shift</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
