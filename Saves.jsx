
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Archive, FileText, Clock } from 'lucide-react';
import SavedScheduleList from '../components/saves/SavedScheduleList';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const UNNAMED_SAVES_LIMIT = 15;

export default function SavesPage() {
    const [savedPerformas, setSavedPerformas] = useState([]);
    const [savedSchedules, setSavedSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) { console.error("Not logged in"); }
        };
        fetchUser();
    }, []);

    const cleanupOldSaves = async (schedules) => {
        const isDefaultName = (name) => /^(Performa Week of|Week of) \d{4}-\d{2}-\d{2}( v\d+)?$/.test(name) || /^(Performa Week of|Week of) \d{4}-\d{2}-\d{2} \(Draft\)$/.test(name);
        
        const candidatesForDeletion = schedules
            .filter(s => !s.is_starred && isDefaultName(s.schedule_name))
            .sort((a, b) => new Date(b.published_at) - new Date(a.published_at)); // Sort recent first

        if (candidatesForDeletion.length > UNNAMED_SAVES_LIMIT) {
            const schedulesToDelete = candidatesForDeletion.slice(UNNAMED_SAVES_LIMIT); // Get the oldest ones
            const scheduleIdsToDelete = schedulesToDelete.map(s => s.id);
            if(scheduleIdsToDelete.length === 0) return;

            try {
                // 1. Fetch all shifts for all schedules to be deleted in one go
                const allShiftsToDelete = await base44.entities.Shift.filter({ schedule_id: { $in: scheduleIdsToDelete } });

                // 2. Delete all shifts sequentially with a delay
                for (const shift of allShiftsToDelete) {
                    try {
                        await base44.entities.Shift.delete(shift.id);
                        await delay(50);
                    } catch (e) {
                         if (e?.response?.status !== 404) console.error("Error cleaning old shift:", e);
                    }
                }

                // 3. Delete all schedules sequentially with a delay
                for (const scheduleId of scheduleIdsToDelete) {
                   try {
                        await base44.entities.WeeklySchedule.delete(scheduleId);
                        await delay(50);
                    } catch (e) {
                        if (e?.response?.status !== 404) console.error("Error cleaning old schedule:", e);
                    }
                }
            } catch (error) {
                console.error(`Failed to cleanup old schedules:`, error);
            }
        }
    };

    const loadSaves = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const allSaves = await base44.entities.WeeklySchedule.filter({
                is_published: true,
                created_by: currentUser.email,
            });
            
            const performas = allSaves.filter(s => s.schedule_type === 'performa');
            const fullSchedules = allSaves.filter(s => s.schedule_type === 'full_schedule');
            
            // Run cleanup separately for performas and full schedules
            await cleanupOldSaves(performas);
            await cleanupOldSaves(fullSchedules);

            // Re-fetch after cleanup
            const finalSaves = await base44.entities.WeeklySchedule.filter({
                is_published: true,
                created_by: currentUser.email,
            });
            
            finalSaves.sort((a, b) => {
                if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
                return new Date(b.published_at) - new Date(a.published_at);
            });

            setSavedPerformas(finalSaves.filter(s => s.schedule_type === 'performa'));
            setSavedSchedules(finalSaves.filter(s => s.schedule_type === 'full_schedule'));

        } catch (error) {
            console.error("Failed to load saved schedules:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            loadSaves();
        }
    }, [currentUser, loadSaves]);

    return (
        <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#de6a2b' }}>
            <div className="max-w-7xl mx-auto space-y-6">
                 <div className="p-6 rounded-lg" style={{backgroundColor: 'var(--bg-module)'}}>
                    <h1 className="text-3xl font-bold blazin-text flex items-center gap-3">
                        <Archive className="w-8 h-8" style={{ color: 'var(--brand-orange)' }} />
                        Manage Saves
                    </h1>
                    <p className="blazin-text-light mt-1">Rename, star, and delete your saved schedule templates. Un-starred, unnamed saves are limited to the 15 most recent.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-96 rounded-lg" style={{backgroundColor: 'var(--bg-divider)'}} />
                            <Skeleton className="h-96 rounded-lg" style={{backgroundColor: 'var(--bg-divider)'}} />
                        </>
                    ) : (
                        <>
                            <SavedScheduleList
                                title="Saved Performas"
                                icon={FileText}
                                schedules={savedPerformas}
                                onUpdate={loadSaves}
                            />
                            <SavedScheduleList
                                title="Saved Schedules"
                                icon={Clock}
                                schedules={savedSchedules}
                                onUpdate={loadSaves}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
