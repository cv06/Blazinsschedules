
import React, { useState, useEffect, useCallback } from 'react';
import { WeeklySchedule } from '@/api/entities';
import { Shift } from '@/api/entities';
import { Employee } from '@/api/entities';
import { SalesProjection } from '@/api/entities';
import { StoreSettings } from '@/api/entities';
import { User } from '@/api/entities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { Printer, Calendar, Users, List, Eye, Sheet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import FullWeekView from '../components/published_schedules/FullWeekView';
import EmployeeView from '../components/published_schedules/EmployeeView';
import DailyView from '../components/published_schedules/DailyView';

export default function PublishedSchedules() {
  const [publishedSchedules, setPublishedSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeView, setActiveView] = useState('fullWeek');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false); // Renamed from isPrintView to clarify purpose
  const [outputView, setOutputView] = useState('online'); // Add back output view toggle
  const [currentUser, setCurrentUser] = useState(null);

  // Effect to fetch the current user
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (e) {
          console.error("Failed to fetch current user:", e);
        }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      setIsLoading(true);
      try {
        let schedules;
        
        // Define the base filter to only get published "full_schedule" types.
        const filterParams = { 
          is_published: true, 
          schedule_type: 'full_schedule' 
        };

        if (currentUser) {
          filterParams.created_by = currentUser.email;
        }
        
        // Fetch schedules, sorting by the publication date to get the most recent one first.
        schedules = await WeeklySchedule.filter(filterParams, "-published_at");

        setPublishedSchedules(schedules || []);
        
        // Automatically select the first schedule in the list (which is the most recent).
        if (schedules && schedules.length > 0) {
          setSelectedScheduleId(schedules[0].id);
        } else {
          setSelectedScheduleId('');
          setScheduleData(null);
        }
      } catch (error) {
        console.error("Error loading schedules:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Load schedules when component mounts or currentUser changes
    loadSchedules();
  }, [currentUser]); // Dependency on currentUser

  const loadScheduleData = useCallback(async () => {
    if (!selectedScheduleId) {
      setScheduleData(null);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    try {
      const schedule = publishedSchedules.find(s => s.id === selectedScheduleId);
      if (!schedule) {
        setIsDataLoading(false);
        setScheduleData(null);
        return;
      }

      console.log("Loading data for schedule:", schedule);

      // As per outline, removed currentUser filtering from these sub-entity fetches
      const [shifts, employees, sales, settings] = await Promise.all([
        Shift.filter({ schedule_id: selectedScheduleId }),
        Employee.filter({ is_active: true }),
        SalesProjection.filter({ week_start_date: schedule.week_start_date }),
        StoreSettings.list(),
      ]);

      console.log("Loaded schedule data:", { shifts, employees, sales, settings });

      setScheduleData({ schedule, shifts, employees, sales, settings: settings[0] });
    } catch (error) {
      console.error("Error loading schedule data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [selectedScheduleId, publishedSchedules]); // Removed currentUser from dependencies

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const handlePrint = async () => {
    if (!selectedScheduleId) return;

    try {
      setIsGeneratingPdf(true); // Indicate PDF generation is in progress
      
      const { exportSchedulePDF } = await import('@/api/functions');
      const response = await exportSchedulePDF({
        scheduleId: selectedScheduleId,
        viewType: activeView
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const schedule = publishedSchedules.find(s => s.id === selectedScheduleId);
        const scheduleName = schedule?.schedule_name || `Week of ${format(new Date(schedule?.week_start_date + 'T00:00:00'), 'MMM-d-yyyy')}`;
        
        a.download = `${scheduleName}_${activeView}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPdf(false); // Reset loading state
    }
  };

  const renderView = () => {
    if (isLoading || isDataLoading || !scheduleData) {
      return <Skeleton className="h-96 w-full mt-4" />;
    }

    const isPrintView = outputView === 'printable';
    const props = { ...scheduleData, isPrintView };

    switch (activeView) {
      case 'employee':
        return <EmployeeView {...props} />;
      case 'daily':
        return <DailyView {...props} />;
      case 'fullWeek':
      default:
        return <FullWeekView {...props} />;
    }
  };

  return (
    <>
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-orange)' }}>
        <div className="max-w-7xl mx-auto space-y-6">
          <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
            <CardHeader className="border-b" style={{borderColor: 'var(--text-charcoal)'}}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold blazin-text flex items-center gap-3">
                    <Sheet className="w-8 h-8" style={{ color: 'var(--text-charcoal)' }} />
                    Published Schedules
                  </h1>
                  <p className="blazin-text-light mt-1">View, print, and export finalized schedules.</p>
                </div>

                <div className="flex items-center gap-4">
                    {isLoading ? <Skeleton className="h-10 w-48" /> : (
                      <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId} disabled={publishedSchedules.length === 0}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder={publishedSchedules.length === 0 ? "No published schedules" : "Select a schedule week"} />
                        </SelectTrigger>
                        <SelectContent>
                          {publishedSchedules.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.schedule_name || `Week of ${format(new Date(s.week_start_date + 'T00:00:00'), 'MMM d, yyyy')}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      onClick={handlePrint} 
                      disabled={isDataLoading || !selectedScheduleId || isGeneratingPdf}
                      style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)' }}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                    </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
               <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <ToggleGroup type="single" value={activeView} onValueChange={(v) => v && setActiveView(v)} aria-label="Schedule View" disabled={isDataLoading || !selectedScheduleId}>
                      <ToggleGroupItem value="fullWeek" aria-label="Full Week View">
                        <Calendar className="w-4 h-4 mr-2"/> Full Week
                      </ToggleGroupItem>
                      <ToggleGroupItem value="employee" aria-label="Employee View">
                        <Users className="w-4 h-4 mr-2"/> By Employee
                      </ToggleGroupItem>
                      <ToggleGroupItem value="daily" aria-label="Daily View">
                        <List className="w-4 h-4 mr-2"/> By Day
                      </ToggleGroupItem>
                    </ToggleGroup>
                    
                    <ToggleGroup type="single" value={outputView} onValueChange={(v) => v && setOutputView(v)} aria-label="Output View" disabled={isDataLoading || !selectedScheduleId}>
                      <ToggleGroupItem value="online" aria-label="Online View">
                        <Eye className="w-4 h-4 mr-2"/> Online
                      </ToggleGroupItem>
                      <ToggleGroupItem value="printable" aria-label="Printable View">
                        <Printer className="w-4 h-4 mr-2"/> Printable
                      </ToggleGroupItem>
                    </ToggleGroup>
                </div>
                <div className="mt-6">
                  {publishedSchedules.length === 0 && !isLoading ? (
                    <div className="text-center py-12">
                      <Sheet className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-charcoal)', opacity: 0.3 }} />
                      <h3 className="text-xl font-semibold blazin-text mb-2">No Published Schedules</h3>
                      <p className="blazin-text-light">Create and publish a schedule to view it here.</p>
                    </div>
                  ) : (
                    renderView()
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
