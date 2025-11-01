import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeeklySchedule, SalesProjection, Position, Employee, Shift, StoreSettings, Availability, TimeOffRequest, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, addDays, subDays, parse, differenceInDays } from "date-fns";
import { ChevronLeft, ChevronRight, Send, Copy, LayoutGrid, List, Clock, Heart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import WeeklySummary from "../components/performa/WeeklySummary";
import ScheduleDay from "../components/schedule_builder/ScheduleDay";
import ScheduleGridView from "../components/schedule_builder/ScheduleGridView";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const timeToDecimal = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
};

export default function ScheduleBuilder() {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }));
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [allData, setAllData] = useState({
    schedule: null,
    performaSchedule: null,
    sales: [],
    positions: [],
    employees: [],
    shifts: [],
    settings: null,
    availability: [],
    timeOff: [],
  });
  const [publishedSchedules, setPublishedSchedules] = useState([]);
  const [scheduleToCopyId, setScheduleToCopyId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('day');

  const saveQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  const processSaveQueue = useCallback(async () => {
    if (isProcessingQueue.current || saveQueue.current.length === 0) return;
    isProcessingQueue.current = true;

    while (saveQueue.current.length > 0) {
      const { type, payload } = saveQueue.current.shift();
      try {
        if (type === 'update') {
          await Shift.update(payload.updatedShift.id, payload.updatedShift);
        } else if (type === 'create') {
          const tempId = payload.newShiftData.id;
          const mainShiftPayload = { ...payload.newShiftData };
          delete mainShiftPayload.id;
          
          if (!allData.schedule?.id) {
            console.error("Cannot create shift without valid schedule");
            throw new Error("Cannot create shift without valid schedule");
          }
          mainShiftPayload.schedule_id = allData.schedule.id;
          const newShift = await Shift.create(mainShiftPayload);
          setAllData(prev => ({
            ...prev,
            shifts: prev.shifts.map(s => s.id === tempId ? newShift : s)
          }));
        } else if (type === 'delete') {
          if (payload.shiftToDelete) {
            try { 
              await Shift.delete(payload.shiftToDelete.id); 
            } catch (e) { 
              if (e?.response?.status !== 404) console.warn("Could not delete shift:", e); 
            }
          }
        }
      } catch (error) {
        console.error(`Failed to process save queue item:`, error);
      }
      await delay(50);
    }
    isProcessingQueue.current = false;
  }, [allData.schedule]);

  useEffect(() => {
    const interval = setInterval(() => processSaveQueue(), 300);
    return () => clearInterval(interval);
  }, [processSaveQueue]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) { }
    };
    fetchUser();
  }, []);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const formattedDate = format(weekStartDate, "yyyy-MM-dd");
    const weekDates = DAYS_OF_WEEK.map((_, i) => format(addDays(weekStartDate, i), "yyyy-MM-dd"));

    let [performaDraft] = await WeeklySchedule.filter({ 
      week_start_date: formattedDate, 
      created_by: currentUser.email, 
      schedule_type: "performa", 
      is_published: false 
    });
    
    if (!performaDraft) {
      performaDraft = await WeeklySchedule.create({ 
        week_start_date: formattedDate, 
        schedule_name: `Week of ${formattedDate} (Performa Draft)`, 
        created_by: currentUser.email, 
        schedule_type: "performa", 
        is_published: false, 
        version_number: 0 
      });
    }

    let [scheduleDraft] = await WeeklySchedule.filter({ 
      week_start_date: formattedDate, 
      created_by: currentUser.email, 
      schedule_type: "full_schedule", 
      is_published: false 
    });
    
    if (!scheduleDraft) {
      scheduleDraft = await WeeklySchedule.create({ 
        week_start_date: formattedDate, 
        schedule_name: `Week of ${formattedDate} (Draft)`, 
        created_by: currentUser.email, 
        schedule_type: "full_schedule", 
        is_published: false, 
        version_number: 0 
      });
    }

    const finalShiftsData = await Shift.filter({ schedule_id: scheduleDraft.id });

    const salesData = await SalesProjection.filter({ week_start_date: formattedDate, created_by: currentUser.email });
    const positionsData = await Position.filter({ is_active: true, created_by: currentUser.email });
    const employeesData = await Employee.filter({ is_active: true, created_by: currentUser.email });
    const settingsData = await StoreSettings.filter({ created_by: currentUser.email });
    const availabilityData = await Availability.filter({ created_by: currentUser.email });
    const timeOffData = await TimeOffRequest.filter({ 
      status: 'approved', 
      start_date: { $lte: weekDates[6] }, 
      end_date: { $gte: weekDates[0] }, 
      created_by: currentUser.email 
    });
    const publishedSchedulesData = await WeeklySchedule.filter({ 
      schedule_type: "full_schedule", 
      is_published: true, 
      created_by: currentUser.email 
    });

    const timeOffForWeek = timeOffData.flatMap(req => {
      const dates = [];
      let currentDate = parse(req.start_date, 'yyyy-MM-dd', new Date());
      const endDate = parse(req.end_date, 'yyyy-MM-dd', new Date());
      while(currentDate <= endDate) {
        const formattedCurrentDate = format(currentDate, "yyyy-MM-dd");
        if(weekDates.includes(formattedCurrentDate)) {
          dates.push({ ...req, request_date: formattedCurrentDate });
        }
        currentDate = addDays(currentDate, 1);
      }
      return dates;
    });

    setAllData({
      schedule: scheduleDraft,
      performaSchedule: performaDraft,
      sales: salesData,
      positions: positionsData,
      employees: employeesData,
      shifts: finalShiftsData,
      settings: settingsData[0],
      availability: availabilityData,
      timeOff: timeOffForWeek,
    });
    
    publishedSchedulesData.sort((a, b) => {
      if (a.is_starred !== b.is_starred) return a.is_starred ? -1 : 1;
      return new Date(b.published_at) - new Date(a.published_at);
    });
    setPublishedSchedules(publishedSchedulesData.filter(s => s.id !== scheduleDraft.id));
    setIsLoading(false);
  }, [weekStartDate, currentUser]);

  useEffect(() => {
    if(currentUser) loadData();
  }, [currentUser, loadData]);

  const handleShiftDelete = async (shiftToDeleteId) => {
    const shiftToDelete = allData.shifts.find(s => s.id === shiftToDeleteId);
    setAllData(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== shiftToDeleteId) }));
    saveQueue.current.push({ type: 'delete', payload: { shiftToDelete } });
  };

  const handleShiftsChange = async (updatedShift) => {
    setAllData(prev => ({ ...prev, shifts: prev.shifts.map(s => s.id === updatedShift.id ? updatedShift : s) }));
    saveQueue.current.push({ type: 'update', payload: { updatedShift } });
  };
  
  const handleShiftCreate = async (newShiftData) => {
    if (!currentUser) return;
    let schedule = allData.schedule;
    
    if (!schedule) {
      const formattedDate = format(weekStartDate, "yyyy-MM-dd");
      let [scheduleDraft] = await WeeklySchedule.filter({ 
        week_start_date: formattedDate, 
        created_by: currentUser.email, 
        schedule_type: "full_schedule", 
        is_published: false 
      });
      
      if (!scheduleDraft) {
        scheduleDraft = await WeeklySchedule.create({ 
          week_start_date: formattedDate, 
          schedule_name: `Week of ${formattedDate} (Draft)`, 
          created_by: currentUser.email, 
          schedule_type: "full_schedule", 
          is_published: false, 
          version_number: 0 
        });
      }
      schedule = scheduleDraft;
      setAllData(prev => ({ ...prev, schedule }));
    }

    const tempShift = { ...newShiftData, id: `temp-${Date.now()}`};
    setAllData(prev => ({ ...prev, shifts: [...prev.shifts, tempShift] }));
    saveQueue.current.push({ type: 'create', payload: { newShiftData: tempShift } });
    return tempShift;
  };

  const calculateTotals = useCallback(() => {
    if (!allData.shifts || !allData.employees || !allData.sales || !allData.settings) {
      return { totalHours: 0, totalLaborCost: 0, totalSales: 0, laborPercentage: 0, salesPerLaborHour: 0, preOpenHours: 0, postCloseHours: 0 };
    }
    
    const { shifts, employees, sales, settings } = allData;
    let totalHours = 0;
    let totalLaborCost = 0;
    let preOpenHours = 0;
    let postCloseHours = 0;
    const totalSales = sales.reduce((sum, s) => sum + (s.total_daily_sales || 0), 0);
    const openTime = timeToDecimal(settings?.open_time);
    const closeTime = timeToDecimal(settings?.close_time);

    shifts.forEach(shift => {
      const shiftHours = shift.hours || 0;
      totalHours += shiftHours;

      if (shift.employee_id) {
        const employee = employees.find(e => e.employee_id === shift.employee_id);
        if (employee && employee.pay_type === 'hourly') {
          totalLaborCost += shiftHours * employee.hourly_rate;
        }
      }

      if (openTime !== null && closeTime !== null) {
        const shiftStart = timeToDecimal(shift.start_time);
        const shiftEnd = timeToDecimal(shift.end_time);
        let actualShiftEnd = shiftEnd < shiftStart ? shiftEnd + 24 : shiftEnd;
        
        if (shiftStart < openTime) {
          preOpenHours += Math.max(0, Math.min(openTime, actualShiftEnd) - shiftStart);
        }
        if (actualShiftEnd > closeTime) {
          postCloseHours += Math.max(0, actualShiftEnd - Math.max(closeTime, shiftStart));
        }
      }
    });

    const laborPercentage = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;
    const salesPerLaborHour = totalHours > 0 ? totalSales / totalHours : 0;
    return { totalHours, totalLaborCost, totalSales, laborPercentage, salesPerLaborHour, preOpenHours, postCloseHours };
  }, [allData]);

  const calculateTotalsRef = useRef(calculateTotals);
  useEffect(() => { calculateTotalsRef.current = calculateTotals; }, [calculateTotals]);

  const saveShifts = useCallback(async () => {
    if (!allData.schedule) return;
    const finalTotals = calculateTotalsRef.current();
    await WeeklySchedule.update(allData.schedule.id, {
      total_labor_cost: finalTotals.totalLaborCost,
      labor_percentage: finalTotals.laborPercentage,
      total_projected_sales: finalTotals.totalSales,
      sales_per_labor_hour: finalTotals.salesPerLaborHour,
      pre_open_hours: finalTotals.preOpenHours,
      post_close_hours: finalTotals.postCloseHours,
    });
    await delay(50);
  }, [allData.schedule]);

  useEffect(() => {
    if (!currentUser || !allData.schedule) return;
    const autoSaveTimer = setTimeout(async () => {
      try { await saveShifts(); } 
      catch (error) { console.error('Auto-save failed:', error); }
    }, 5000);
    return () => clearTimeout(autoSaveTimer);
  }, [allData.shifts, allData.schedule, currentUser, saveShifts]);

  const getNextVersionNumber = useCallback(async (weekStartDateStr, scheduleType) => {
    const existingVersions = await WeeklySchedule.filter({
      week_start_date: weekStartDateStr,
      created_by: currentUser.email,
      schedule_type: scheduleType,
      is_published: true
    });
    return Math.max(0, ...existingVersions.map(s => s.version_number || 0)) + 1;
  }, [currentUser]);

  const cleanupOldVersions = useCallback(async (weekStartDateStr, scheduleType) => {
    const publishedVersions = await WeeklySchedule.filter({
      week_start_date: weekStartDateStr,
      created_by: currentUser.email,
      schedule_type: scheduleType,
      is_published: true
    });
    
    const sortedVersions = publishedVersions.sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
    const versionsToDelete = sortedVersions.slice(5);
    
    for (const version of versionsToDelete) {
      const shifts = await Shift.filter({ schedule_id: version.id });
      for (const shift of shifts) {
        try { await Shift.delete(shift.id); await delay(50); }
        catch (error) { if (error?.response?.status !== 404) console.error('Error deleting old shift:', error); }
      }
      try { await WeeklySchedule.delete(version.id); await delay(50); }
      catch (error) { if (error?.response?.status !== 404) console.error('Error deleting old schedule:', error); }
    }
  }, [currentUser]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const formattedDate = format(weekStartDate, "yyyy-MM-dd");
      const weeklyTotals = calculateTotalsRef.current();
      const nextVersion = await getNextVersionNumber(formattedDate, "full_schedule");
      
      const newPublishedSchedule = await WeeklySchedule.create({
        week_start_date: formattedDate,
        schedule_name: `Week of ${formattedDate} v${nextVersion}`,
        created_by: currentUser.email,
        schedule_type: "full_schedule",
        version_number: nextVersion,
        is_published: true,
        published_at: new Date().toISOString(),
        total_labor_cost: weeklyTotals.totalLaborCost,
        labor_percentage: weeklyTotals.laborPercentage,
        total_projected_sales: weeklyTotals.totalSales,
        sales_per_labor_hour: weeklyTotals.salesPerLaborHour,
        pre_open_hours: weeklyTotals.preOpenHours,
        post_close_hours: weeklyTotals.postCloseHours
      });
      await delay(50);

      const newShiftsToCreate = allData.shifts.map(shift => ({
        ...shift,
        id: undefined,
        schedule_id: newPublishedSchedule.id,
        created_by: currentUser.email,
      }));
      
      if (newShiftsToCreate.length > 0) {
        await Shift.bulkCreate(newShiftsToCreate);
        await delay(50);
      }

      await cleanupOldVersions(formattedDate, "full_schedule");
      await loadData(); 
    } catch (error) {
      console.error("Failed to publish schedule:", error);
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleCopySchedule = async () => {
    if (!scheduleToCopyId || !allData.schedule || !currentUser) return;
    setIsLoading(true);

    const activeEmployeeIds = new Set(allData.employees.filter(e => e.is_active).map(e => e.employee_id));
    const sourceSchedule = publishedSchedules.find(s => s.id === scheduleToCopyId);
    
    if (!sourceSchedule) {
      setIsLoading(false);
      return;
    }

    const sourceShifts = await Shift.filter({ schedule_id: scheduleToCopyId, created_by: currentUser.email });
    const currentDraftShifts = await Shift.filter({ schedule_id: allData.schedule.id, created_by: currentUser.email });
    
    for (const shift of currentDraftShifts) {
      try {
        await Shift.delete(shift.id);
        await delay(50);
      } catch (error) {
        if (error?.response?.status !== 404) console.error("Failed to delete draft shift:", error);
      }
    }
    
    const dateOffset = differenceInDays(weekStartDate, parse(sourceSchedule.week_start_date, 'yyyy-MM-dd', new Date()));

    for (const oldShift of sourceShifts) {
      const newDate = format(addDays(parse(oldShift.date, 'yyyy-MM-dd', new Date()), dateOffset), "yyyy-MM-dd");
      const newEmployeeId = oldShift.employee_id && activeEmployeeIds.has(oldShift.employee_id) ? oldShift.employee_id : null;

      await Shift.create({
        ...oldShift,
        id: undefined,
        date: newDate,
        employee_id: newEmployeeId,
        schedule_id: allData.schedule.id,
        created_by: currentUser.email
      });
      await delay(50);
    }

    await loadData();
    setScheduleToCopyId("");
  };
  
  const weeklyTotals = calculateTotals();
  const changeWeek = (direction) => {
    setWeekStartDate(current => direction === 'next' ? addDays(current, 7) : subDays(current, 7));
  };
  
  if (!currentUser && isLoading) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-64 w-full rounded-lg mb-4" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#de6a2b' }}>
      <div className="sticky top-0 z-50 pt-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto rounded-lg border p-4 mb-4" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold blazin-text flex items-center gap-3">
                <Clock className="w-8 h-8" style={{ color: 'var(--brand-orange)' }} />
                Schedule Builder
              </h1>
              <p className="blazin-text-light mt-1">Assign employees and publish your weekly schedule.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{backgroundColor: 'var(--bg-divider)'}}>
                <Button variant="ghost" size="icon" onClick={() => changeWeek('prev')} className="blazin-text">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="font-semibold blazin-text text-lg whitespace-nowrap px-2">
                  Week of {format(weekStartDate, "MMMM d, yyyy")}
                </div>
                <Button variant="ghost" size="icon" onClick={() => changeWeek('next')} className="blazin-text">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <Button 
                onClick={handlePublish} 
                disabled={isPublishing || isLoading}
                className="px-6 py-3 text-base rounded-lg font-semibold border-2"
                style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)', borderColor: 'var(--text-charcoal)' }}
              >
                <Send className="w-4 h-4 mr-2" />
                {isPublishing ? 'Publishing...' : 'Publish Schedule'}
              </Button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--bg-divider)'}}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 p-2 rounded-xl" style={{backgroundColor: 'var(--bg-divider)'}}>
                <p className="font-semibold blazin-text shrink-0 pr-2">Copy Schedule:</p>
                <Select value={scheduleToCopyId} onValueChange={setScheduleToCopyId}>
                  <SelectTrigger className="w-full sm:w-[250px]" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                    <SelectValue placeholder="Select a published week..." />
                  </SelectTrigger>
                  <SelectContent style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                    {publishedSchedules.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          {s.is_starred && <Heart className="w-4 h-4 fill-current" style={{color: 'var(--brand-orange)'}} />}
                          <span>{s.schedule_name || `Week of ${format(new Date(s.week_start_date + 'T00:00:00'), 'MMM d, yyyy')}`}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCopySchedule} 
                  disabled={!scheduleToCopyId || isLoading}
                  variant="default"
                  className="blazin-text"
                  style={{backgroundColor: 'var(--bg-module)', color: 'var(--text-charcoal)'}}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
              <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value)} className="rounded-lg p-1" style={{backgroundColor: 'var(--bg-divider)'}}>
                <ToggleGroupItem value="day" className="gap-2 data-[state=on]:bg-brand-orange data-[state=on]:text-bg-module" style={{color: 'var(--text-charcoal)'}}>
                  <List className="w-4 h-4" /> Day View
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" className="gap-2 data-[state=on]:bg-brand-orange data-[state=on]:text-bg-module" style={{color: 'var(--text-charcoal)'}}>
                  <LayoutGrid className="w-4 h-4" /> Grid View
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--bg-divider)'}}>
            {isLoading ? <Skeleton className="h-24 w-full rounded-lg" /> : <WeeklySummary totals={weeklyTotals} targetLabor={allData.settings?.target_labor_percentage || 0} />}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pb-16">
        <div className="space-y-4">
          {isLoading ? (
            DAYS_OF_WEEK.map(day => <Skeleton key={day} className="h-72 w-full rounded-lg" style={{backgroundColor: 'var(--bg-divider)'}} />)
          ) : view === 'day' ? (
            DAYS_OF_WEEK.map((day, index) => (
              <ScheduleDay
                key={day}
                day={day}
                date={addDays(weekStartDate, index)}
                allData={allData}
                onShiftsChange={handleShiftsChange}
                onShiftDelete={handleShiftDelete}
                onShiftCreate={handleShiftCreate}
              />
            ))
          ) : (
            <ScheduleGridView
              weekStartDate={weekStartDate}
              allData={allData}
              onShiftsChange={handleShiftsChange}
              onShiftCreate={handleShiftCreate}
              onShiftDelete={handleShiftDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}