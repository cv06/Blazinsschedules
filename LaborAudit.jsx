
import React, { useState, useEffect, useCallback } from 'react';
import {
  WeeklySchedule,
  SalesProjection,
  Shift,
  Employee,
  StoreSettings,
  User
} from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, addDays, subDays, parse } from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Edit,
  Download
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportLaborAuditXLSX } from "@/api/functions";

import AuditDayCard from '../components/labor_audit/AuditDayCard';
import WeeklyAuditSummary from '../components/labor_audit/WeeklyAuditSummary';

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
};

export default function LaborAudit() {
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }));
  const [auditData, setAuditData] = useState({
    schedule: null,
    sales: [],
    shifts: [],
    employees: [],
    settings: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [varianceReasons, setVarianceReasons] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (e) { /* Not logged in */ }
    }
    fetchUser();
  }, []);

  // This effect runs once on mount to fetch the list of available schedules
  useEffect(() => {
    if (!currentUser) return; // Wait for user to be loaded
    const fetchSchedules = async () => {
      setIsLoading(true);
      const schedulesData = await WeeklySchedule.filter({ is_published: true, created_by: currentUser.email }, '-week_start_date');
      setSchedules(schedulesData);

      if (schedulesData.length > 0) {
        // Default to the most recent published schedule
        setSelectedScheduleId(schedulesData[0].id);
      } else {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, [currentUser]); // Add currentUser to dependency array

  const loadAuditData = useCallback(async () => {
    if (!selectedScheduleId || schedules.length === 0 || !currentUser) return; // Wait for user to be loaded

    setIsLoading(true);
    const schedule = schedules.find(s => s.id === selectedScheduleId);
    if (!schedule) {
      setIsLoading(false);
      return;
    }
    
    setWeekStartDate(parse(schedule.week_start_date, 'yyyy-MM-dd', new Date()));
    setVarianceReasons(schedule.variance_notes || {});

    const [salesData, shiftsData, employeesData, settingsData] = await Promise.all([
      SalesProjection.filter({ week_start_date: schedule.week_start_date, created_by: currentUser.email }),
      Shift.filter({ schedule_id: schedule.id }),
      Employee.filter({ is_active: true }),
      StoreSettings.list()
    ]);
    
    setAuditData({
      schedule,
      sales: salesData,
      shifts: shiftsData.map(s => ({
        ...s,
        actual_start_time: s.actual_start_time || s.start_time,
        actual_end_time: s.actual_end_time || s.end_time,
        variance_reason: s.variance_reason || '',
      })),
      employees: employeesData,
      settings: settingsData[0]
    });

    setIsLoading(false);
  }, [selectedScheduleId, schedules, currentUser]); // Add currentUser to dependency array

  // This effect runs whenever the selected schedule changes
  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const handleDataChange = (type, id, field, value) => {
    setAuditData(prev => {
      const newAuditData = { ...prev };
      if (type === 'sales') {
        newAuditData.sales = prev.sales.map(s => {
          if (s.id === id) {
            const updatedSale = { ...s, [field]: parseFloat(value) || 0 };
            // Auto-calculate legacy actual_sales field for backward compatibility
            updatedSale.actual_sales = (updatedSale.actual_am_sales || 0) + (updatedSale.actual_pm_sales || 0);
            return updatedSale;
          }
          return s;
        });
      }
      if (type === 'shifts') {
        newAuditData.shifts = prev.shifts.map(s => s.id === id ? { ...s, [field]: value } : s);
      }
      return newAuditData;
    });
  };

  const handleReasonChange = (day, reason) => {
    setVarianceReasons(prev => ({ ...prev, [day]: reason }));
  };

  const handleSaveAudit = async () => {
    setIsSaving(true);
    const { schedule, sales, shifts, employees } = auditData;
    const employeeMap = new Map(employees.map(e => [e.employee_id, e]));
    let totalActualLaborCost = 0;

    // Update shifts
    for (const shift of shifts) {
      const actualHours = Math.max(0, timeToDecimal(shift.actual_end_time) - timeToDecimal(shift.actual_start_time));
      const employee = employeeMap.get(shift.employee_id);
      const actualLaborCost = employee ? actualHours * employee.hourly_rate : 0;
      totalActualLaborCost += actualLaborCost;
      await Shift.update(shift.id, {
        actual_start_time: shift.actual_start_time,
        actual_end_time: shift.actual_end_time,
        variance_reason: shift.variance_reason,
      });
    }

    // Update sales with new AM/PM structure
    let totalActualSales = 0;
    for (const sale of sales) {
      const actualAmSales = sale.actual_am_sales || 0;
      const actualPmSales = sale.actual_pm_sales || 0;
      const actualTotalSales = actualAmSales + actualPmSales;
      totalActualSales += actualTotalSales;
      
      await SalesProjection.update(sale.id, { 
        actual_am_sales: actualAmSales,
        actual_pm_sales: actualPmSales,
        actual_sales: actualTotalSales // Maintain backward compatibility
      });
    }

    // Update weekly schedule summary
    const actualLaborPercentage = totalActualSales > 0 ? (totalActualLaborCost / totalActualSales) * 100 : 0;
    await WeeklySchedule.update(schedule.id, {
      actual_labor_cost: totalActualLaborCost,
      actual_labor_percentage: actualLaborPercentage,
      variance_notes: varianceReasons
    });

    setIsSaving(false);
    loadAuditData(); // Refresh data
  };

  const handleExport = async () => {
    if (!auditData.schedule) return;

    setIsExporting(true);
    try {
        const response = await exportLaborAuditXLSX({ scheduleId: auditData.schedule.id });
        
        // Convert base64 string to a byte array
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
        link.setAttribute("download", `Labor_Audit_${auditData.schedule.week_start_date}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export XLSX file:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const changeWeek = (direction) => {
    const currentIndex = schedules.findIndex(s => s.id === selectedScheduleId);
    // Note: Assuming schedules are sorted in descending order by date, so index 0 is most recent
    if (direction === 'next' && currentIndex > 0) { // 'Next' goes to an older schedule (higher index)
      setSelectedScheduleId(schedules[currentIndex - 1].id);
    }
    if (direction === 'prev' && currentIndex < schedules.length - 1) { // 'Prev' goes to a newer schedule (lower index)
      setSelectedScheduleId(schedules[currentIndex + 1].id);
    }
  };

  const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="sticky top-0 z-50 pb-2">
        <div className="max-w-7xl mx-auto p-6 pb-0">
          <Card className="border rounded-lg overflow-hidden mb-2" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
            <CardHeader className="border-b p-6" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold blazin-text-heading flex items-center gap-3">
                    <Edit className="w-8 h-8" style={{ color: 'var(--brand-orange)' }} />
                    Labor Audit
                  </h1>
                  <p className="blazin-text-light mt-1">Compare projected vs. actual performance.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId} disabled={isLoading || schedules.length === 0}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select a week to audit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.schedule_name || `Week of ${format(parse(s.week_start_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1 p-2 rounded-lg border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                    <Button variant="ghost" size="icon" onClick={() => changeWeek('prev')} disabled={isLoading || selectedScheduleId === schedules[schedules.length - 1]?.id}><ChevronLeft className="w-5 h-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => changeWeek('next')} disabled={isLoading || selectedScheduleId === schedules[0]?.id}><ChevronRight className="w-5 h-5" /></Button>
                  </div>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    disabled={isLoading || !auditData.schedule || isExporting}
                    className="blazin-text"
                    style={{borderColor: 'var(--text-charcoal)'}}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export Report'}
                  </Button>
                  <Button onClick={handleSaveAudit} disabled={isSaving || isLoading || !auditData.schedule} className="px-6 py-3 text-base font-semibold" style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)'}}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Audit"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {isLoading || !auditData.schedule ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <WeeklyAuditSummary data={auditData} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {isLoading || !auditData.schedule ? (
          DAYS_OF_WEEK.map(day => <Skeleton key={day} className="h-80 w-full" />)
        ) : (
          DAYS_OF_WEEK.map((day, index) => {
            const date = format(addDays(weekStartDate, index), 'yyyy-MM-dd');
            return (
              <AuditDayCard
                key={day}
                day={day}
                date={date}
                shiftsForDay={auditData.shifts.filter(s => s.date === date)}
                salesForDay={auditData.sales.find(s => s.day_of_week === day)}
                employees={auditData.employees}
                onDataChange={handleDataChange}
                reason={varianceReasons[day] || ''}
                onReasonChange={handleReasonChange}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
