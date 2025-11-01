import React, { useState, useEffect, useMemo } from 'react';
import EmployeeSelector from './EmployeeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit, Save, X, Check } from 'lucide-react';
import { formatTime } from '@/components/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PositionSelector = ({ positions, selectedPositions, onPositionToggle }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full justify-between blazin-text"
                style={{ backgroundColor: 'var(--bg-divider)' }}
            >
                <span>{selectedPositions.length > 0 ? selectedPositions.join(', ') : 'Select Positions'}</span>
                <X className="h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <div className="absolute w-full bottom-full mb-1"></div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" style={{ backgroundColor: 'var(--bg-module)', zIndex: 100 }}>
                        <div className="p-2 space-y-1">
                            {positions.map(p => {
                                const isSelected = selectedPositions.includes(p.name);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => onPositionToggle(p.name)}
                                        className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-black/5"
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-brand-orange border-brand-orange' : 'border-charcoal'}`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="blazin-text text-sm">{p.name}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
};


export default function ShiftRow({ shift, allData, onShiftsChange, onShiftDelete }) {
  const { employees, positions } = allData;
  const [isEditing, setIsEditing] = useState(false);
  const [editableShift, setEditableShift] = useState(shift);

  useEffect(() => {
    setEditableShift(shift);
  }, [shift]);

  const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const handleFieldChange = (field, value) => {
    setEditableShift(prev => ({ ...prev, [field]: value }));
  };

  const handlePositionToggle = (positionName) => {
    setEditableShift(prev => {
        const currentPositions = Array.isArray(prev.position) ? prev.position : [];
        if (currentPositions.includes(positionName)) {
            return { ...prev, position: currentPositions.filter(p => p !== positionName) };
        }
        return { ...prev, position: [...currentPositions, positionName] };
    });
  };

  const handleSave = () => {
    let newShift = { ...editableShift };
    if (newShift.start_time && newShift.end_time) {
      let duration = timeToDecimal(newShift.end_time) - timeToDecimal(newShift.start_time);
      if (duration < 0) duration += 24; // Handle overnight shifts
      newShift.hours = duration;
    }
    onShiftsChange(newShift);
    setIsEditing(false);
  };
  
  const handleSelectEmployee = (employee) => {
    onShiftsChange({ ...shift, employee_id: employee ? employee.employee_id : null });
  };

  const handleUnassign = () => {
    onShiftsChange({ ...shift, employee_id: null });
  };
  
  const employee = employees.find(e => e.employee_id === shift.employee_id);
  
  const laborCost = useMemo(() => {
    if (employee && employee.pay_type === 'hourly' && shift.hours) {
      return shift.hours * employee.hourly_rate;
    }
    return 0;
  }, [employee, shift.hours]);

  const hasPositionConflict = useMemo(() => {
    if (!employee || !shift.position || shift.position.length === 0) return false;
    // Allow 'Team Member' as a valid position for anyone
    if (shift.position.includes('Team Member')) return false;
    const employeePositions = new Set(employee.positions || []);
    return !shift.position.every(p => employeePositions.has(p));
  }, [employee, shift.position]);

  return (
    <div className="p-3 rounded-lg border space-y-2" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
           {employee && hasPositionConflict ? (
                <div className="p-2 rounded-md bg-orange-100/50">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold blazin-text">{employee.first_name} {employee.last_name}</p>
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={handleUnassign}>
                            <X className="w-4 h-4 text-brand-orange"/>
                        </Button>
                    </div>
                    <p className="text-xs font-semibold" style={{color: 'var(--brand-orange)'}}>Wrong Position</p>
                </div>
            ) : (
                <EmployeeSelector
                    selectedEmployee={employee}
                    onSelect={handleSelectEmployee}
                    shift={shift}
                    allData={allData}
                />
            )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
            {isEditing ? (
                <>
                    <Button variant="ghost" size="icon" onClick={handleSave} className="w-8 h-8 text-charcoal hover:bg-black/10">
                        <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="w-8 h-8 text-charcoal hover:bg-black/10">
                        <X className="w-4 h-4" />
                    </Button>
                </>
            ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="w-8 h-8 text-charcoal hover:bg-black/10">
                    <Edit className="w-4 h-4" />
                </Button>
            )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <Input type="time" value={editableShift.start_time || ''} onChange={(e) => handleFieldChange('start_time', e.target.value)} className="blazin-text" style={{backgroundColor: 'var(--bg-divider)'}} />
                <Input type="time" value={editableShift.end_time || ''} onChange={(e) => handleFieldChange('end_time', e.target.value)} className="blazin-text" style={{backgroundColor: 'var(--bg-divider)'}} />
            </div>
            <div className="mt-2">
                <PositionSelector 
                    positions={positions} 
                    selectedPositions={editableShift.position || []} 
                    onPositionToggle={handlePositionToggle} 
                />
            </div>
        </div>
      ) : (
         <div className="text-center">
            <p className="font-semibold blazin-text">{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
            <p className="text-xs blazin-text-light">{shift.position?.join(', ')}</p>
         </div>
      )}

      <div className="flex justify-between items-center pt-2 border-t" style={{borderColor: 'var(--text-charcoal)'}}>
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold blazin-text">
                {shift.hours?.toFixed(2) || '0.00'} hrs / ${laborCost.toFixed(2)}
            </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onShiftDelete(shift.id)} className="w-8 h-8 hover:bg-transparent">
            <Trash2 className="w-4 h-4" style={{color: 'var(--brand-orange)'}} />
        </Button>
      </div>
    </div>
  );
}