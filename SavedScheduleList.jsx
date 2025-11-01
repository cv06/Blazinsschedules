
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Heart, Trash, Edit, Save, X, Star, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function SavedScheduleList({ title, icon: Icon, schedules, onUpdate }) {
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());

    const handleEdit = (schedule) => {
        setEditingId(schedule.id);
        setNewName(schedule.schedule_name);
    };

    const handleCancel = () => {
        setEditingId(null);
        setNewName('');
    };

    const handleSave = async (scheduleId) => {
        if (!newName.trim()) {
            alert("Schedule name cannot be empty.");
            return;
        }
        await base44.entities.WeeklySchedule.update(scheduleId, { schedule_name: newName });
        setEditingId(null);
        setNewName('');
        onUpdate();
    };

    const handleToggleStar = async (schedule) => {
        await base44.entities.WeeklySchedule.update(schedule.id, { is_starred: !schedule.is_starred });
        onUpdate();
    };

    const handleDelete = async (scheduleIds) => {
        const idsToDelete = Array.isArray(scheduleIds) ? scheduleIds : [scheduleIds];
        if (idsToDelete.length === 0) return;

        const confirmation = idsToDelete.length > 1
            ? window.confirm(`Are you sure you want to delete ${idsToDelete.length} selected schedules? This action cannot be undone.`)
            : window.confirm(`Are you sure you want to delete this schedule? This action cannot be undone.`);

        if (confirmation) {
            try {
                // 1. Fetch all shifts for all schedules to be deleted in one go
                const allShiftsToDelete = await base44.entities.Shift.filter({ schedule_id: { $in: idsToDelete } });

                // 2. Delete all shifts sequentially with a delay
                for (const shift of allShiftsToDelete) {
                    await base44.entities.Shift.delete(shift.id);
                    await delay(50);
                }

                // 3. Delete all schedules sequentially with a delay
                for (const scheduleId of idsToDelete) {
                    await base44.entities.WeeklySchedule.delete(scheduleId);
                    await delay(50);
                }
            } catch (error) {
                console.error("Bulk delete failed:", error);
                alert("An error occurred during deletion. Please try again. If the problem persists, the rate limit might have been exceeded.");
            }
            setSelectedIds(new Set()); // Clear selection
            onUpdate();
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (schedules.length === 0) return;
        if (selectedIds.size === schedules.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(schedules.map(s => s.id)));
        }
    };

    return (
        <div className="rounded-lg overflow-hidden" style={{backgroundColor: 'var(--bg-module)'}}>
            <div className="flex flex-row items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6" style={{ color: 'var(--brand-orange)' }} />
                    <h2 className="text-xl font-bold blazin-text">{title}</h2>
                </div>
                {selectedIds.size > 0 && (
                     <Button 
                        variant="destructive" 
                        onClick={() => handleDelete(Array.from(selectedIds))}
                        style={{backgroundColor: '#c02626', color: 'white'}}
                    >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete ({selectedIds.size})
                    </Button>
                )}
            </div>
            <div className="p-6" style={{backgroundColor: 'var(--bg-divider)'}}>
                <div className="space-y-3">
                     <div className="flex items-center p-3 rounded-lg" style={{backgroundColor: 'var(--bg-module)'}}>
                        <Checkbox
                            id={`select-all-${title}`}
                            checked={schedules.length > 0 && selectedIds.size === schedules.length}
                            onCheckedChange={handleSelectAll}
                            className="mr-3"
                            disabled={schedules.length === 0}
                        />
                        <label htmlFor={`select-all-${title}`} className="flex-1 font-bold text-sm blazin-text">
                            {selectedIds.size === schedules.length && schedules.length > 0 ? 'Deselect All' : 'Select All'}
                        </label>
                    </div>
                    {schedules.length === 0 ? (
                         <div className="text-center py-10 rounded-lg" style={{backgroundColor: 'var(--bg-module)'}}>
                            <FileText className="w-12 h-12 mx-auto" style={{ color: 'var(--bg-divider)' }} />
                            <p className="mt-4 text-sm font-semibold blazin-text-light">No saved {title.toLowerCase().replace('saved ','')} found.</p>
                        </div>
                    ) : (
                        schedules.map(schedule => (
                            <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-lg" style={{backgroundColor: 'var(--bg-module)'}}>
                                <Checkbox
                                    checked={selectedIds.has(schedule.id)}
                                    onCheckedChange={() => toggleSelection(schedule.id)}
                                />
                                <div className="flex-1">
                                    {editingId === schedule.id ? (
                                        <div className="flex items-center gap-2">
                                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} style={{backgroundColor: 'var(--bg-divider)'}} />
                                            <Button size="icon" variant="ghost" onClick={() => handleSave(schedule.id)}><Save className="w-4 h-4 text-green-600"/></Button>
                                            <Button size="icon" variant="ghost" onClick={handleCancel}><X className="w-4 h-4 text-red-600"/></Button>
                                        </div>
                                    ) : (
                                        <p className="font-semibold blazin-text">{schedule.schedule_name}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs mt-1">
                                        <Badge variant="outline" className="blazin-text border-charcoal">{format(new Date(schedule.week_start_date + 'T00:00:00'), 'MMM d, yyyy')}</Badge>
                                        <Badge variant="secondary" className="blazin-text" style={{backgroundColor: 'var(--bg-divider)'}}>v{schedule.version_number}</Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" onClick={() => handleToggleStar(schedule)}>
                                        <Heart className={`w-4 h-4 ${schedule.is_starred ? 'text-brand-orange fill-current' : 'text-gray-400'}`} style={{color: schedule.is_starred ? 'var(--brand-orange)' : 'var(--text-charcoal)'}} />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(schedule)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDelete(schedule.id)}>
                                        <Trash className="w-4 h-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
