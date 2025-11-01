
import React, { useState, useRef, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Check, ChevronDown, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PositionMultiSelect = ({ positions, selectedPositions, onPositionToggle, onOpenChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
      onOpenChange(isOpen);
    }, [isOpen, onOpenChange]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target) &&
                contentRef.current && !contentRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="relative">
            <button
                ref={triggerRef}
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
                    ref={contentRef}
                    className="absolute z-20 w-full mt-1 border rounded-lg"
                    style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)' }}
                >
                    {positions.sort((a,b) => (a.sort_order ?? 99) - (b.sort_order ?? 99)).map((pos) => {
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


export default function ShiftInputRow({ shift, day, positions, settings, onShiftChange, removeShift }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const timeToDecimal = (time) => {
        if (!time) return 0;
        try {
            const [hours, minutes] = time.split(':').map(Number);
            return hours + minutes / 60;
        } catch {
            return 0;
        }
    };

    const handleFieldChange = (field, value) => {
        const newShift = { ...shift, [field]: value };
        
        if (newShift.start_time && newShift.end_time) {
            const hours = Math.max(0, timeToDecimal(newShift.end_time) - timeToDecimal(newShift.start_time));
            newShift.hours = parseFloat(hours.toFixed(2));
        } else {
            newShift.hours = 0;
        }
        
        onShiftChange(day, shift.tempId, newShift);
    };

     const handlePositionToggle = (positionName) => {
        let currentPositions = shift.position || [];
        let newPositions;

        if (positionName === 'Team Member') {
            // If "Team Member" is selected, it becomes the only position
            newPositions = ['Team Member'];
        } else {
            // If another position is selected
            if (currentPositions.includes(positionName)) {
                // Remove it if it's already there
                newPositions = currentPositions.filter(p => p !== positionName && p !== 'Team Member');
            } else {
                // Add it, and remove "Team Member" if it exists
                newPositions = [...currentPositions.filter(p => p !== 'Team Member'), positionName];
            }
        }
        
        // If all specific positions are removed, default back to Team Member
        if (newPositions.length === 0) {
            newPositions = ['Team Member'];
        }

        handleFieldChange('position', newPositions);
    };

    return (
        <div className={`p-3 rounded-lg space-y-3 ${isDropdownOpen ? 'z-10 relative' : ''}`} style={{backgroundColor: 'var(--bg-module)'}}>
            <div className="flex justify-between items-center gap-2">
                <div className="flex-grow min-w-0">
                    <PositionMultiSelect
                        positions={positions}
                        selectedPositions={shift.position || []}
                        onPositionToggle={handlePositionToggle}
                        onOpenChange={setIsDropdownOpen}
                    />
                </div>
                 <Button variant="ghost" size="icon" className="w-7 h-7 flex-shrink-0 blazin-text" onClick={() => removeShift(day, shift.tempId)}>
                    <X className="w-5 h-5" />
                </Button>
            </div>
           
            <div className="flex items-center gap-2 relative">
                <div className="relative flex-1">
                     <Input 
                        type="time"
                        value={shift.start_time || ''}
                        onChange={(e) => handleFieldChange('start_time', e.target.value)}
                        className="h-10 w-full"
                        style={{backgroundColor: 'var(--brand-orange)', border: 'none', color: 'var(--bg-module)', colorScheme: 'dark'}}
                    />
                </div>
                <span className="blazin-text-light">-</span>
                <div className="relative flex-1">
                    <Input 
                        type="time"
                        value={shift.end_time || ''}
                        onChange={(e) => handleFieldChange('end_time', e.target.value)}
                        className="h-10 w-full"
                        style={{backgroundColor: 'var(--brand-orange)', border: 'none', color: 'var(--bg-module)', colorScheme: 'dark'}}
                    />
                </div>
                <div className="w-20 text-right text-sm font-semibold" style={{color: 'var(--brand-orange)'}}>
                    {shift.hours?.toFixed(1) || '0.0'} hrs
                </div>
            </div>
        </div>
    );
}
