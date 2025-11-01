
import React, { useState, useEffect, useCallback } from 'react';
import { StoreSettings } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Settings as SettingsIcon, Store, Sliders } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch'; // Import Switch

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (e) {
                console.error("Failed to fetch current user:", e);
                // Handle error, e.g., redirect to login or show an error message
            }
        }
        fetchUser();
    }, []);

    const loadSettings = useCallback(async () => {
        if (!currentUser) return; // Only load settings once currentUser is available
        setIsLoading(true);
        try {
            const settingsData = await StoreSettings.filter({ created_by: currentUser.email });
            if (settingsData.length > 0) {
                setSettings(settingsData[0]);
            } else {
                // Create default settings if none exist for this user
                const newSettings = await StoreSettings.create({
                    store_name: "",
                    location: "",
                    target_labor_percentage: 0,
                    schedule_generation_strategy: "skeleton",
                    open_time: "08:00",
                    close_time: "22:00",
                    lunch_end_time: "12:00",
                    midday_end_time: "17:00",
                    dinner_end_time: "21:00",
                    week_start_day: "monday",
                    temperature_unit: "fahrenheit",
                    show_end_times_on_week_view: false, // Add default value
                    created_by: currentUser.email // Link settings to the current user
                });
                setSettings(newSettings);
            }
        } catch (error) {
            console.error("Failed to load or create settings:", error);
            // Optionally, handle the error state for the UI
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]); // Re-run loadSettings when currentUser changes

    useEffect(() => {
        loadSettings();
    }, [loadSettings]); // Effect depends on loadSettings function

    const handleInputChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSwitchChange = (field, checked) => {
        setSettings(prev => ({ ...prev, [field]: checked }));
    };

    const handleSave = async () => {
        if (!settings || !currentUser) return; // Ensure settings and user are available
        setIsSaving(true);
        try {
            // Include created_by in the update payload to maintain the link, although the backend might already enforce it.
            await StoreSettings.update(settings.id, { ...settings, created_by: currentUser.email });
            // Optionally show a success message
        } catch (error) {
            console.error("Failed to save settings:", error);
            // Optionally, show an error message to the user
        } finally {
            setIsSaving(false);
        }
    };

    const renderSkeleton = () => (
        <div className="space-y-8">
            <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div></CardContent></Card>
            {/* Skeleton for the new Scheduling Engine card */}
            <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-14 w-full" /> {/* For target labor % */}
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-14 w-full" /> {/* For store open time */}
                            <Skeleton className="h-14 w-full" /> {/* For store close time */}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-14 w-full" /> {/* For lunch end time */}
                        <Skeleton className="h-14 w-full" /> {/* For midday end time */}
                        <Skeleton className="h-14 w-full" /> {/* For dinner end time */}
                    </div>
                    {/* Skeleton for the new Toggle for End Times */}
                    <div className="pt-4 border-t" style={{ borderColor: 'var(--bg-divider)' }}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-6 w-10 rounded-full" /> {/* For the Switch */}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-40">
                <div className="max-w-5xl mx-auto mb-6 px-6 py-4 flex justify-between items-center rounded-lg border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                    <h1 className="text-2xl font-bold blazin-text flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6" style={{color: 'var(--text-charcoal)'}}/>
                        Settings
                    </h1>
                    <Button onClick={handleSave} disabled={isSaving || isLoading || !currentUser} className="font-semibold" style={{backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)'}}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
            
            {/* Main content area */}
            <div className="max-w-4xl mx-auto">
                {isLoading || !settings ? renderSkeleton() : (
                    <div className="space-y-8">
                        {/* Store Details Card */}
                        <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 blazin-text"><Store className="w-5 h-5"/>Store Details</CardTitle>
                                <CardDescription className="blazin-text-light">Basic information about your business.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="store_name" className="blazin-text">Store Name</Label>
                                    <Input id="store_name" value={settings.store_name || ''} onChange={(e) => handleInputChange('store_name', e.target.value)} className="mt-1"/>
                                </div>
                                <div>
                                    <Label htmlFor="location" className="blazin-text">Store Location</Label>
                                    <Input id="location" value={settings.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className="mt-1" placeholder="e.g., New York, NY"/>
                                    <p className="text-xs blazin-text-light mt-1">Used for fetching local weather forecasts.</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* New Card: Scheduling Engine */}
                        <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 blazin-text"><Sliders className="w-5 h-5"/>Scheduling Engine</CardTitle>
                                <CardDescription className="blazin-text-light">Configure parameters for automatic schedule generation and shift timings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Target Labor % */}
                                    <div>
                                        <Label htmlFor="target_labor_percentage" className="blazin-text">Target Labor %</Label>
                                        <div className="relative mt-1">
                                            <Input
                                                id="target_labor_percentage"
                                                type="number"
                                                value={settings.target_labor_percentage || ''}
                                                onChange={(e) => handleInputChange('target_labor_percentage', parseFloat(e.target.value) || 0)}
                                                className="pr-8"
                                            />
                                            <span className="absolute inset-y-0 right-3 flex items-center text-sm blazin-text-light">%</span>
                                        </div>
                                    </div>
                                    {/* Store Open/Close Times */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="open_time" className="blazin-text">Store Open</Label>
                                            <Input
                                                id="open_time"
                                                type="time"
                                                value={settings.open_time || ''}
                                                onChange={(e) => handleInputChange('open_time', e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="close_time" className="blazin-text">Store Close</Label>
                                            <Input
                                                id="close_time"
                                                type="time"
                                                value={settings.close_time || ''}
                                                onChange={(e) => handleInputChange('close_time', e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Mid-day Shift Times */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <Label htmlFor="lunch_end_time" className="blazin-text">Lunch End Time</Label>
                                        <Input id="lunch_end_time" type="time" value={settings.lunch_end_time || ''} onChange={(e) => handleInputChange('lunch_end_time', e.target.value)} className="mt-1"/>
                                    </div>
                                    <div>
                                        <Label htmlFor="midday_end_time" className="blazin-text">Midday End Time</Label>
                                        <Input id="midday_end_time" type="time" value={settings.midday_end_time || ''} onChange={(e) => handleInputChange('midday_end_time', e.target.value)} className="mt-1"/>
                                    </div>
                                    <div>
                                        <Label htmlFor="dinner_end_time" className="blazin-text">Dinner End Time</Label>
                                        <Input id="dinner_end_time" type="time" value={settings.dinner_end_time || ''} onChange={(e) => handleInputChange('dinner_end_time', e.target.value)} className="mt-1"/>
                                    </div>
                                </div>

                                {/* New Toggle for End Times */}
                                <div className="pt-4 border-t" style={{ borderColor: 'var(--bg-divider)' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label htmlFor="show_end_times" className="blazin-text font-semibold">Show Shift End Times</Label>
                                            <p className="text-sm blazin-text-light">Display full shift times (e.g., 9am-5pm) on the weekly schedule view.</p>
                                        </div>
                                        <Switch
                                            id="show_end_times"
                                            checked={settings.show_end_times_on_week_view || false}
                                            onCheckedChange={(checked) => handleSwitchChange('show_end_times_on_week_view', checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
