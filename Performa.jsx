
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  WeeklySchedule,
  SalesProjection,
  Position,
  Employee,
  Shift,
  StoreSettings,
  User,
  Availability,
  PublishJob // ADDED
} from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, addDays, subDays, parse, differenceInDays } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  Download,
  Copy,
  Loader2,
  Heart,
  CheckCircle2 // ADDED
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportPerformaXLSX } from "@/api/functions";
import { processPublishJob } from "@/api/functions"; // ADDED

import WeeklySummary from "../components/performa/WeeklySummary";
import DayCard from "../components/performa/DayCard";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const timeToDecimal = (time) => {
    if (!time) return 0;
    try {
        const [hours, minutes] = time.split(':').map(Number);
        return hours + minutes / 60;
    } catch {
        return 0;
    }
};

// Helper function for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function Performa() {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }));
  const [sales, setSales] = useState([]);
  const [positions, setPositions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [avgWage, setAvgWage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Used for initial publish job creation
  const [isAutoSaving, setIsAutoSaving] = useState(false); // Used for periodic draft auto-saves
  const [isExporting, setIsExporting] = useState(false);
  // const isSavingRef = useRef(false); // No longer needed as isSaving state covers initial save

  const [performaShifts, setPerformaShifts] = useState({});
  const [currentDraftScheduleId, setCurrentDraftScheduleId] = useState(null);
  const [newName, setNewName] = useState("");

  const [publishedSchedules, setPublishedSchedules] = useState([]);
  const [scheduleToCopyId, setScheduleToCopyId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Publishing status tracking
  const [publishJobStatus, setPublishJobStatus] = useState(null); // { status: 'pending'|'in_progress'|'completed'|'failed', jobId: string, completedAt?: string, error?: string }
  const publishPollInterval = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (e) { /* Not logged in */ }
    }
    fetchUser();
  }, []);

  const ensureTeamMemberPositionExists = useCallback(async () => {
    if (!currentUser) return;
    const existing = await Position.filter({ name: 'Team Member', created_by: currentUser.email });
    if (existing.length === 0) {
        await Position.create({
            name: 'Team Member',
            description: 'A general role for schedule planning before specific assignments.',
            is_active: true,
            sort_order: -1,
            created_by: currentUser.email
        });
    }
  }, [currentUser]);

  const getNextVersionNumber = useCallback(async (weekStartDate, scheduleType) => {
    const existingVersions = await WeeklySchedule.filter({
      week_start_date: weekStartDate,
      created_by: currentUser.email,
      schedule_type: scheduleType,
      is_published: true
    });
    const maxVersion = Math.max(0, ...existingVersions.map(s => s.version_number || 0));
    return maxVersion + 1;
  }, [currentUser]);

  const cleanupOldVersions = useCallback(async (weekStartDate, scheduleType) => {
    const publishedVersions = await WeeklySchedule.filter({
      week_start_date: weekStartDate,
      created_by: currentUser.email,
      schedule_type: scheduleType,
      is_published: true
    }, { sort_by: '-version_number' });
    
    const versionsToDelete = publishedVersions.slice(5);
    for (const version of versionsToDelete) {
      const shifts = await Shift.filter({ schedule_id: version.id });
      for (const shift of shifts) {
        try {
          await Shift.delete(shift.id);
        } catch (error) {
          if (error?.response?.status !== 404) {
            console.error('Error deleting old shift version:', error);
          }
        }
      }
      try {
        await WeeklySchedule.delete(version.id);
      } catch (error) {
         if (error?.response?.status !== 404) {
            console.error('Error deleting old schedule version:', error);
         }
      }
    }
  }, [currentUser]);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);

    await ensureTeamMemberPositionExists();

    const formattedDate = format(weekStartDate, "yyyy-MM-dd");

    let [currentPerformaSchedule] = await WeeklySchedule.filter({
        week_start_date: formattedDate,
        created_by: currentUser.email,
        schedule_type: "performa",
        is_published: false
    }, '-created_date');

    setCurrentDraftScheduleId(currentPerformaSchedule?.id || null);

    let currentScheduleId = currentPerformaSchedule?.id;

    const [
      salesData,
      positionsData,
      employeesData,
      settingsData,
      availabilityData,
      publishedSchedulesData
    ] = await Promise.all([
      SalesProjection.filter({ week_start_date: formattedDate, created_by: currentUser.email }),
      Position.filter({ is_active: true }),
      Employee.filter({ is_active: true }),
      StoreSettings.list(),
      Availability.list(),
      WeeklySchedule.filter({
        is_published: true,
        schedule_type: "performa",
        created_by: currentUser.email,
      }, '', 50),
    ]);

    const shiftsForCurrentPerforma = currentScheduleId ? await Shift.filter({ schedule_id: currentScheduleId }) : [];

    setSales(salesData);
    setPositions(positionsData);
    setSettings(settingsData[0]);
    
    publishedSchedulesData.sort((a, b) => {
        if (a.is_starred !== b.is_starred) {
            return a.is_starred ? -1 : 1;
        }
        return new Date(b.published_at) - new Date(a.published_at);
    });
    setPublishedSchedules(publishedSchedulesData); 

    const calculateAvgWage = (dayOfWeek, isAM) => {
      const storeOpenTime = timeToDecimal(settingsData[0]?.open_time || "08:00");
      const storeMiddayEndTime = timeToDecimal(settingsData[0]?.midday_end_time || "17:00");
      const storeCloseTime = timeToDecimal(settingsData[0]?.close_time || "22:00");

      let periodStart, periodEnd;
      if (isAM) {
          periodStart = storeOpenTime;
          periodEnd = storeMiddayEndTime;
      } else {
          periodStart = storeMiddayEndTime;
          periodEnd = storeCloseTime;
      }

      const availableEmployees = employeesData.filter(emp => {
        if (emp.pay_type !== 'hourly') return false;
        
        const capitalizedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        const dayAvailability = availabilityData.find(a => 
            a.employee_id === emp.employee_id && 
            a.day_of_week === capitalizedDayOfWeek && 
            a.is_available
        );
        
        if (!dayAvailability || !dayAvailability.start_time || !dayAvailability.end_time) {
          return true;
        }
        
        const availStart = timeToDecimal(dayAvailability.start_time);
        const availEnd = timeToDecimal(dayAvailability.end_time);
        
        return Math.max(periodStart, availStart) < Math.min(periodEnd, availEnd);
      });
      
      if (availableEmployees.length === 0) {
        const hourlyEmployees = employeesData.filter(emp => emp.pay_type === 'hourly');
        if (hourlyEmployees.length === 0) return 15;
        return hourlyEmployees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / hourlyEmployees.length;
      }
      
      return availableEmployees.reduce((sum, emp) => sum + emp.hourly_rate, 0) / availableEmployees.length;
    };

    const allAmWages = DAYS_OF_WEEK.map(day => calculateAvgWage(day, true)).filter(w => w > 0);
    const allPmWages = DAYS_OF_WEEK.map(day => calculateAvgWage(day, false)).filter(w => w > 0);
    
    const hourlyEmployeesOverall = employeesData.filter(e => e.pay_type === 'hourly');
    const defaultOverallAvgWage = hourlyEmployeesOverall.length > 0
        ? hourlyEmployeesOverall.reduce((sum, e) => sum + e.hourly_rate, 0) / hourlyEmployeesOverall.length
        : 15;

    const overallAvgWage = [...allAmWages, ...allPmWages].length > 0 
      ? [...allAmWages, ...allPmWages].reduce((sum, w) => sum + w, 0) / ([...allAmWages, ...allPmWages].length) 
      : defaultOverallAvgWage;
    
    setAvgWage(overallAvgWage);

    const initialShifts = {};
    DAYS_OF_WEEK.forEach(day => { initialShifts[day] = []; });
    
    shiftsForCurrentPerforma.forEach(shift => {
      const day = format(parse(shift.date, 'yyyy-MM-dd', new Date()), 'eeee').toLowerCase();
      if (initialShifts[day]) {
        initialShifts[day].push({
          ...shift,
          tempId: shift.id,
          position: Array.isArray(shift.position) ? shift.position : [shift.position], 
          hours: shift.hours || Math.max(0, timeToDecimal(shift.end_time) - timeToDecimal(shift.start_time))
        });
      }
    });

    setPerformaShifts(initialShifts);
    setIsLoading(false);
  }, [weekStartDate, currentUser, ensureTeamMemberPositionExists]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const getShiftDuration = (shiftType, customStart, customEnd) => {
    if (customStart && customEnd) {
        return Math.max(0, timeToDecimal(customEnd) - timeToDecimal(customStart));
    }
    if (!settings || !shiftType) return 0;
    const { open_time, lunch_end_time, midday_end_time, dinner_end_time, close_time } = settings;
    const startTimes = { lunch: open_time, midday: lunch_end_time, dinner: midday_end_time, late_night: dinner_end_time };
    const endTimes = { lunch: lunch_end_time, midday: midday_end_time, dinner: dinner_end_time, late_night: close_time };
    return Math.max(0, timeToDecimal(endTimes[shiftType]) - timeToDecimal(startTimes[shiftType]));
  };
  
  const handleShiftChange = async (day, tempId, updatedShiftData) => {
      let originalShift;
      const newPerformaShifts = {
          ...performaShifts,
          [day]: performaShifts[day].map(s => {
              if (s.tempId === tempId) {
                  originalShift = s;
                  const newShift = { ...s, ...updatedShiftData };
                  if (newShift.position !== undefined && !Array.isArray(newShift.position)) {
                      newShift.position = [newShift.position];
                  }
                  return newShift;
              }
              return s;
          })
      };
      setPerformaShifts(newPerformaShifts);

      if (updatedShiftData.shift_type !== undefined || updatedShiftData.start_time !== undefined || updatedShiftData.end_time !== undefined) {
          const updatedShift = newPerformaShifts[day].find(s => s.tempId === tempId);
          if (updatedShift) {
              const newHours = getShiftDuration(updatedShift.shift_type, updatedShift.start_time, updatedShift.end_time);
              if (newHours !== updatedShift.hours) {
                  updatedShift.hours = newHours;
                  setPerformaShifts(prev => ({
                      ...prev,
                      [day]: prev[day].map(s => s.tempId === tempId ? { ...s, hours: newHours } : s)
                  }));
              }
          }
      }

      const updatedShift = newPerformaShifts[day].find(s => s.tempId === tempId);
      
      if (updatedShift && updatedShift.id && !String(updatedShift.id).startsWith('new-')) {
        try {
            setIsAutoSaving(true);
            const { tempId: _, ...dbPayload } = updatedShift;
            await Shift.update(dbPayload.id, dbPayload);
        } catch (error) {
            console.error("Auto-save update failed:", error);
        } finally {
            setIsAutoSaving(false);
        }
      }
  };

  const addShift = async (day, shiftPeriod = 'pm') => {
      if (!currentUser) {
          console.error("Cannot add shift: User not logged in.");
          return;
      }
      
      let draftId = currentDraftScheduleId;

      if (!draftId) {
          const formattedDate = format(weekStartDate, "yyyy-MM-dd");
          let [draftSchedule] = await WeeklySchedule.filter({
              week_start_date: formattedDate,
              created_by: currentUser.email,
              schedule_type: "performa",
              is_published: false
          });

          if (!draftSchedule) {
              draftSchedule = await WeeklySchedule.create({
                  week_start_date: formattedDate,
                  schedule_name: `Performa Week of ${formattedDate} (Draft)`,
                  created_by: currentUser.email,
                  schedule_type: "performa",
                  is_published: false,
                  version_number: 0
              });
          }
          draftId = draftSchedule.id;
          setCurrentDraftScheduleId(draftId);
      }

      const defaultStartTime = (shiftPeriod === 'pm' && settings) ? settings.midday_end_time : '09:00';
      const defaultEndTime = (shiftPeriod === 'pm' && settings) ? settings.close_time : '17:00';
      const hours = Math.max(0, timeToDecimal(defaultEndTime) - timeToDecimal(defaultStartTime));

      const tempId = `new-${Date.now()}-${Math.random()}`;
      const newShiftPlaceholder = { 
          tempId: tempId, 
          position: ['Team Member'],
          start_time: defaultStartTime, 
          end_time: defaultEndTime, 
          hours: hours, 
          shift_type: (shiftPeriod === 'pm') ? 'dinner' : 'lunch' 
      };

      setPerformaShifts(prev => ({
          ...prev,
          [day]: [...prev[day], newShiftPlaceholder]
      }));

      try {
        setIsAutoSaving(true);
        
        let determinedShiftType = 'lunch';
        const startTimeDecimal = timeToDecimal(newShiftPlaceholder.start_time);
        if (settings) {
            if (startTimeDecimal >= timeToDecimal(settings.dinner_end_time)) determinedShiftType = 'late_night';
            else if (startTimeDecimal >= timeToDecimal(settings.midday_end_time)) determinedShiftType = 'dinner';
            else if (startTimeDecimal >= timeToDecimal(settings.lunch_end_time)) determinedShiftType = 'midday';
        }

        const shiftPayload = {
            date: format(addDays(weekStartDate, DAYS_OF_WEEK.indexOf(day)), "yyyy-MM-dd"),
            start_time: newShiftPlaceholder.start_time,
            end_time: newShiftPlaceholder.end_time,
            position: newShiftPlaceholder.position,
            hours: newShiftPlaceholder.hours,
            shift_type: determinedShiftType,
            schedule_id: draftId,
            created_by: currentUser.email,
        };
        const createdShift = await Shift.create(shiftPayload);

        setPerformaShifts(prev => ({
            ...prev,
            [day]: prev[day].map(s => s.tempId === tempId ? { ...createdShift, tempId: createdShift.id } : s)
        }));
      } catch (error) {
        console.error("Failed to create shift:", error);
        setPerformaShifts(prev => ({
            ...prev,
            [day]: prev[day].filter(s => s.tempId !== tempId)
        }));
      } finally {
        setIsAutoSaving(false);
      }
  };
  
  const removeShift = async (day, tempId) => {
      const shiftToRemove = performaShifts[day]?.find(s => s.tempId === tempId);
      if (!shiftToRemove) return;

      setPerformaShifts(prev => ({
          ...prev,
          [day]: prev[day].filter(s => s.tempId !== tempId)
      }));

      if (shiftToRemove.id && !String(shiftToRemove.id).startsWith('new-')) {
          try {
            setIsAutoSaving(true);
            await Shift.delete(shiftToRemove.id);
          } catch (error) {
              if (error?.response?.status !== 404) {
                console.error("Failed to delete shift:", error);
                setPerformaShifts(prev => ({
                    ...prev,
                    [day]: [...prev[day], shiftToRemove].sort((a,b) => timeToDecimal(a.start_time) - timeToDecimal(b.start_time))
                }));
              }
          } finally {
            setIsAutoSaving(false);
          }
      }
  };

  const calculateTotals = useCallback(() => {
    let totalHours = 0;
    let preOpenHours = 0;
    let postCloseHours = 0;
    const totalSales = sales.reduce((sum, s) => sum + s.total_daily_sales, 0);

    const openTime = settings?.open_time ? timeToDecimal(settings.open_time) : null;
    const closeTime = settings?.close_time ? timeToDecimal(settings.close_time) : null;

    for (const day in performaShifts) {
      performaShifts[day].forEach(shift => {
        const shiftHours = shift.hours || 0;
        totalHours += shiftHours;
        
        if (openTime !== null && closeTime !== null && shift.start_time && shift.end_time) {
            const shiftStart = timeToDecimal(shift.start_time);
            const shiftEnd = timeToDecimal(shift.end_time);

            if (shiftStart < openTime) {
                preOpenHours += Math.max(0, Math.min(openTime, shiftEnd) - shiftStart);
            }
            if (shiftEnd > closeTime) {
                postCloseHours += Math.max(0, shiftEnd - Math.max(closeTime, shiftStart));
            }
        }
      });
    }
    
    const totalLaborCost = totalHours * avgWage;
    const laborPercentage = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;
    const salesPerLaborHour = totalHours > 0 ? totalSales / totalHours : 0;
    const preOpenLaborCost = preOpenHours * avgWage;
    const postCloseLaborCost = postCloseHours * avgWage;

    return { totalHours, totalLaborCost, totalSales, laborPercentage, salesPerLaborHour, preOpenHours, postCloseHours, preOpenLaborCost, postCloseLaborCost };
  }, [sales, performaShifts, avgWage, settings]);

  const calculateTotalsRef = useRef(calculateTotals);
  useEffect(() => { calculateTotalsRef.current = calculateTotals; }, [calculateTotals]);

  const saveCurrentState = useCallback(async () => {
    if (!currentUser || !currentDraftScheduleId) return;

    const formattedDate = format(weekStartDate, "yyyy-MM-dd");

    // Sync all in-memory shifts to database
    const existingShiftsInDb = await Shift.filter({ schedule_id: currentDraftScheduleId });
    const existingShiftIds = new Set(existingShiftsInDb.map(s => s.id));
    
    for (const day of DAYS_OF_WEEK) { // Iterate through all days to ensure all shifts are covered
        const shiftsForDay = performaShifts[day] || [];
        for (const shift of shiftsForDay) {
            if (shift.id && !String(shift.id).startsWith('new-')) {
                // Update existing shift
                const { tempId, ...dbPayload } = shift;
                await Shift.update(shift.id, dbPayload);
                existingShiftIds.delete(shift.id); // Mark as processed
                await delay(30);
            } else if (String(shift.tempId).startsWith('new-')) { // This is a new shift that wasn't saved yet
                const shiftPayload = {
                    date: shift.date || format(addDays(weekStartDate, DAYS_OF_WEEK.indexOf(day)), "yyyy-MM-dd"),
                    start_time: shift.start_time,
                    end_time: shift.end_time,
                    position: shift.position,
                    hours: shift.hours,
                    shift_type: shift.shift_type,
                    schedule_id: currentDraftScheduleId,
                    created_by: currentUser.email,
                };
                await Shift.create(shiftPayload);
                await delay(30);
            }
        }
    }
    
    // Delete shifts that exist in DB but not in current state
    for (const shiftId of existingShiftIds) {
        try {
            await Shift.delete(shiftId);
            await delay(30);
        } catch (e) {
            if (e?.response?.status !== 404) {
                console.error("Error deleting orphaned shift:", e);
            }
        }
    }

    // Update schedule totals
    const { totalLaborCost, laborPercentage } = calculateTotals();
    await WeeklySchedule.update(currentDraftScheduleId, {
        total_labor_cost: totalLaborCost,
        labor_percentage: laborPercentage
    });
  }, [currentUser, currentDraftScheduleId, weekStartDate, performaShifts, calculateTotals]);

  useEffect(() => {
    if (!currentUser || isLoading || !currentDraftScheduleId) return;
    
    const autoSaveTimer = setTimeout(async () => {
      try {
          setIsAutoSaving(true);
          const { totalLaborCost, laborPercentage } = calculateTotals();
          await WeeklySchedule.update(currentDraftScheduleId, {
              total_labor_cost: totalLaborCost,
              labor_percentage: laborPercentage
          });
      } catch (error) {
          console.error("Failed to auto-save totals:", error);
      } finally {
          setIsAutoSaving(false);
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [performaShifts, currentUser, isLoading, currentDraftScheduleId, calculateTotals]);

  // Poll for publish job status
  useEffect(() => {
    if (!publishJobStatus || publishJobStatus.status === 'completed' || publishJobStatus.status === 'failed') {
      if (publishPollInterval.current) {
        clearInterval(publishPollInterval.current);
        publishPollInterval.current = null;
      }
      return;
    }

    publishPollInterval.current = setInterval(async () => {
      try {
        const job = await PublishJob.get(publishJobStatus.jobId);
        if (job.status === 'completed') {
          setPublishJobStatus({ status: 'completed', completedAt: job.completed_at, jobId: job.id });
          clearInterval(publishPollInterval.current);
          publishPollInterval.current = null;
          
          // Refresh published schedules list
          const publishedPerformas = await WeeklySchedule.filter({
            schedule_type: "performa", 
            is_published: true, 
            created_by: currentUser.email
          }, { sort: '-published_at' });
          setPublishedSchedules(publishedPerformas);
        } else if (job.status === 'failed') {
          setPublishJobStatus({ status: 'failed', error: job.error_message, jobId: job.id });
          clearInterval(publishPollInterval.current);
          publishPollInterval.current = null;
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (publishPollInterval.current) {
        clearInterval(publishPollInterval.current);
      }
    };
  }, [publishJobStatus, currentUser, setPublishedSchedules]);

  const handleBuildShifts = async () => {
    if (!currentUser || !currentDraftScheduleId) {
        console.error("Cannot publish: User not logged in or no draft schedule available.");
        return;
    }
    
    try {
      setIsSaving(true);

      // Step 1: Save current state to database
      await saveCurrentState();
      await delay(100); // Ensure saves are complete

      const formattedDate = format(weekStartDate, "yyyy-MM-dd");

      // Step 2: Create a publish job record
      const job = await PublishJob.create({
        week_start_date: formattedDate,
        performa_schedule_id: currentDraftScheduleId,
        status: 'pending',
        created_by: currentUser.email,
        name: newName || `Performa Week of ${formattedDate}` // Use stored name or a default
      });

      // Step 3: Start tracking the job in UI
      setPublishJobStatus({ status: 'pending', jobId: job.id });

      // Step 4: Trigger the background worker
      processPublishJob({ jobId: job.id }).catch(error => {
        console.error('Error triggering background publish job:', error);
        setPublishJobStatus(prev => ({ ...prev, status: 'failed', error: error.message || 'Failed to trigger background process' }));
      });

    } catch (error) {
      console.error('Failed to create or trigger publish job:', error);
      alert('An error occurred during publishing. Please try again.');
      setPublishJobStatus({ status: 'failed', error: error.message || 'Unknown error' });
    } finally {
      setIsSaving(false); // Initial job creation is done
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Ensure the current UI state is saved to the draft schedule before exporting
      await saveCurrentState();
      await delay(100); // Small delay to ensure DB operations are complete
      
      if (currentDraftScheduleId) {
        const response = await exportPerformaXLSX({ 
          scheduleId: currentDraftScheduleId 
        });
        
        const byteCharacters = atob(response.data.file);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Performa_Schedule_${format(weekStartDate, "yyyy-MM-dd")}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        console.error("No draft schedule ID available for export after saving.");
        alert("Cannot export: Failed to save or retrieve the draft performa schedule ID. Please try again.");
      }
    } catch (error) {
        console.error("Failed to export XLSX file:", error);
        alert("Failed to export Performa schedule. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  const handleCopyPerforma = async () => {
    if (!scheduleToCopyId || !currentDraftScheduleId || !currentUser) {
        alert("Please select a schedule to copy, ensure a current draft exists, and you are logged in.");
        return;
    }

    setIsLoading(true);
    try {
        const sourceSchedule = publishedSchedules.find(s => s.id === scheduleToCopyId);
        if (!sourceSchedule) {
            setIsLoading(false);
            return;
        }

        const shiftsToCopy = await Shift.filter({ schedule_id: scheduleToCopyId });
        const existingDraftShifts = await Shift.filter({ schedule_id: currentDraftScheduleId });
        
        for (const shift of existingDraftShifts) {
            try {
                await Shift.delete(shift.id);
                await delay(50);
            } catch (error) {
                if (error?.response?.status !== 404) {
                    console.error(`Error deleting shift ${shift.id}:`, error);
                }
            }
        }

        const dateOffset = differenceInDays(weekStartDate, parse(sourceSchedule.week_start_date, 'yyyy-MM-dd', new Date()));

        const newShiftsPayload = shiftsToCopy.map(shift => {
            const newDate = format(addDays(parse(shift.date, 'yyyy-MM-dd', new Date()), dateOffset), "yyyy-MM-dd");
            const { id, created_by, updated_date, created_date, schedule_id, ...newShiftData } = shift;
            return {
                ...newShiftData,
                date: newDate,
                schedule_id: currentDraftScheduleId,
                created_by: currentUser.email,
            };
        });

        if (newShiftsPayload.length > 0) {
            await Shift.bulkCreate(newShiftsPayload);
        }

        await loadData();

    } catch (error) {
        console.error("Failed to copy performa:", error);
        alert("An error occurred while copying the schedule. Please try again.");
    } finally {
        setIsLoading(false);
        setScheduleToCopyId("");
    }
  };

  const changeWeek = (direction) => {
    setWeekStartDate(current => direction === 'next' ? addDays(current, 7) : subDays(current, 7));
  };
  
  const weeklyTotals = calculateTotals();

  // Format completed time
  const getPublishStatusText = () => {
    if (!publishJobStatus) return null;
    
    if (publishJobStatus.status === 'pending' || publishJobStatus.status === 'in_progress') {
      return 'Publishing in background...';
    }
    
    if (publishJobStatus.status === 'completed' && publishJobStatus.completedAt) {
      const time = format(new Date(publishJobStatus.completedAt), 'h:mm a');
      return `Published at ${time}`;
    }
    
    if (publishJobStatus.status === 'failed') {
      return `Publish failed: ${publishJobStatus.error || 'unknown error'}`;
    }
    
    return null;
  };

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: '#de6a2b' }}>
      {/* Sticky Header Container */}
      <div className="sticky top-0 z-50 pt-2 -mx-4 sm:-mx-6 px-4 sm:px-6"> 
        <div className="max-w-7xl mx-auto rounded-lg border p-4 mb-4" style={{ backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}> 
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Left side: Title and Week Nav */}
            <div className="flex-grow">
              <h1 className="text-2xl sm:text-3xl font-bold blazin-text flex items-center gap-3">
                <FileText className="w-8 h-8" style={{ color: 'var(--brand-orange)' }} />
                Performa Builder
              </h1>
              <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="icon" onClick={() => changeWeek('prev')} className="blazin-text"><ChevronLeft className="w-5 h-5" /></Button>
                <div className="font-semibold blazin-text text-lg whitespace-nowrap flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--brand-orange)'}} />
                  Week of {format(weekStartDate, "MMMM d, yyyy")}
                </div>
                <Button variant="ghost" size="icon" onClick={() => changeWeek('next')} className="blazin-text"><ChevronRight className="w-5 h-5" /></Button>
              </div>
            </div>
            {/* Right side: Actions */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
               <div className="w-full sm:w-[300px] flex items-center gap-2 p-2 rounded-xl" style={{backgroundColor: 'var(--bg-divider)'}}>
                  <Select value={scheduleToCopyId} onValueChange={setScheduleToCopyId}>
                      <SelectTrigger className="w-full sm:w-[200px]" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                          <SelectValue placeholder="Copy a performa..." />
                      </SelectTrigger>
                      <SelectContent style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                          {publishedSchedules.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-2">
                                  {s.is_starred && <Heart className="w-4 h-4 text-brand-orange fill-current" style={{color: 'var(--brand-orange)'}} />}
                                  <span>{s.schedule_name || `Week of ${format(new Date(s.week_start_date + 'T00:00:00'), 'MMM d, yyyy')}`}</span>
                                </div>
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Button onClick={handleCopyPerforma} disabled={!scheduleToCopyId || isLoading} variant="default" className="blazin-text" style={{backgroundColor: 'var(--bg-module)', color: 'var(--text-charcoal)'}}>
                      <Copy className="w-4 h-4" />
                  </Button>
               </div>
               <Button
                  onClick={handleExport}
                  variant="default"
                  disabled={isExporting || isLoading}
                  className="w-full sm:w-auto blazin-text"
                  style={{backgroundColor: 'var(--bg-divider)', color: 'var(--text-charcoal)'}}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
            </div>
          </div>
          {/* Weekly Summary */}
          <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--bg-divider)'}}>
            {isLoading ? <Skeleton className="h-20 w-full" /> : <WeeklySummary totals={weeklyTotals} targetLabor={settings?.target_labor_percentage || 0} />}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto pb-32">
        {isLoading ? (
            <div className="space-y-4">
                {DAYS_OF_WEEK.map(day => <Skeleton key={day} className="h-64 w-full rounded-xl" style={{backgroundColor: 'var(--bg-divider)'}} />)}
            </div>
        ) : (
            <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => (
                    <DayCard 
                        key={day}
                        day={day}
                        date={addDays(weekStartDate, index)}
                        salesForDay={sales.find(s => s.day_of_week === day)}
                        positions={positions}
                        shifts={performaShifts[day] || []}
                        settings={settings}
                        avgWage={avgWage}
                        onShiftChange={handleShiftChange}
                        addShift={addShift}
                        removeShift={removeShift}
                        getShiftDuration={getShiftDuration}
                    />
                ))}
            </div>
        )}
      </div>
      
      {/* Floating Publish Button with Status */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {isAutoSaving && !publishJobStatus && (
            <div className="flex items-center gap-2 text-sm text-white/80 bg-black/40 px-3 py-1.5 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin"/>
              <span>Auto-saving...</span>
            </div>
          )}
          
          {publishJobStatus && (
            <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium" style={{
              backgroundColor: publishJobStatus.status === 'completed' ? '#10b981' : publishJobStatus.status === 'failed' ? '#ef4444' : '#f59e0b',
              color: '#ffffff'
            }}>
              {publishJobStatus.status === 'completed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : publishJobStatus.status === 'failed' ? (
                <span>✕</span>
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span>{getPublishStatusText()}</span>
            </div>
          )}
          
          <Button 
              onClick={handleBuildShifts} 
              disabled={isLoading || isSaving || (publishJobStatus && publishJobStatus.status !== 'completed' && publishJobStatus.status !== 'failed')} 
              className="px-6 py-4 text-base rounded-full transform hover:scale-105 transition-transform duration-300 font-semibold border-2" 
              style={{ 
                  backgroundColor: 'var(--brand-orange)', 
                  color: 'var(--bg-module)',
                  borderColor: 'var(--text-charcoal)'
              }}
          >
              <Save className="w-5 h-5 mr-2"/>
              {isSaving ? "Creating Job..." : 
               (publishJobStatus && (publishJobStatus.status === 'pending' || publishJobStatus.status === 'in_progress')) ? "Publishing..." :
               "Publish Performa"}
          </Button>
      </div>
    </div>
  );
}
