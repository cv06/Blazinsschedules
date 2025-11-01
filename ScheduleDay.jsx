import React, { useMemo } from 'react';
import ShiftRow from './ShiftRow';
import { Button } from '@/components/ui/button';
import { PlusCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from './StatCard';

const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
};

export default function ScheduleDay({ day, date, allData, onShiftsChange, onShiftDelete, onShiftCreate }) {
  const { shifts, employees, positions, sales, settings, availability, timeOff } = allData;

  const shiftsForDay = shifts.filter(s => s.date === format(date, 'yyyy-MM-dd'));
  const salesForDay = sales.find(s => s.day_of_week === day);
  const specialEvents = salesForDay?.special_events || [];

  const middayDecimal = timeToDecimal(settings?.midday_end_time || '17:00');
  const amShifts = shiftsForDay.filter(s => timeToDecimal(s.start_time) < middayDecimal);
  const pmShifts = shiftsForDay.filter(s => timeToDecimal(s.start_time) >= middayDecimal);

  const dailyTotals = useMemo(() => {
    const calculatePeriodTotals = (periodShifts) => {
        let hours = 0;
        let laborCost = 0;

        periodShifts.forEach(shift => {
            const shiftHours = shift.hours || 0;
            hours += shiftHours;

            if (shift.employee_id) {
                const employee = employees.find(e => e.employee_id === shift.employee_id);
                if (employee && employee.pay_type === 'hourly') {
                    laborCost += shiftHours * employee.hourly_rate;
                }
            }
        });
        return { hours, laborCost };
    };

    const amTotals = calculatePeriodTotals(amShifts);
    const pmTotals = calculatePeriodTotals(pmShifts);

    const totalHours = amTotals.hours + pmTotals.hours;
    const totalLaborCost = amTotals.laborCost + pmTotals.laborCost;
    
    const amSales = (salesForDay?.lunch_sales || 0) + (salesForDay?.midday_sales || 0);
    const pmSales = (salesForDay?.dinner_sales || 0) + (salesForDay?.late_night_sales || 0);
    const totalSales = amSales + pmSales;

    const amLaborPercent = amSales > 0 ? (amTotals.laborCost / amSales) * 100 : 0;
    const pmLaborPercent = pmSales > 0 ? (pmTotals.laborCost / pmSales) * 100 : 0;
    const totalLaborPercent = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;

    return {
        am: { sales: amSales, hours: amTotals.hours, laborCost: amTotals.laborCost, laborPercent: amLaborPercent },
        pm: { sales: pmSales, hours: pmTotals.hours, laborCost: pmTotals.laborCost, laborPercent: pmLaborPercent },
        total: { sales: totalSales, hours: totalHours, laborCost: totalLaborCost, laborPercent: totalLaborPercent },
    };
  }, [shiftsForDay, employees, salesForDay, amShifts, pmShifts]);


  const handleCreateShift = (period) => {
    const defaultStartTime = period === 'am' ? (settings?.open_time || '09:00') : (settings?.midday_end_time || '17:00');
    const defaultEndTime = period === 'am' ? (settings?.midday_end_time || '17:00') : (settings?.close_time || '22:00');
    
    onShiftCreate({
        date: format(date, 'yyyy-MM-dd'),
        start_time: defaultStartTime,
        end_time: defaultEndTime,
        position: ['Team Member'],
        employee_id: null
    });
  };

  return (
    <div className="p-4 rounded-lg" style={{backgroundColor: 'var(--bg-module)'}}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        
        {/* Column 1: Day Header + Stats Cards */}
        <div className="space-y-4">
          <div className="text-left">
            <h2 className="text-2xl font-bold blazin-text capitalize">{day}</h2>
            <p className="blazin-text-light">{format(date, 'MMMM d')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <StatCard title="Sales" am={dailyTotals.am.sales} pm={dailyTotals.pm.sales} total={dailyTotals.total.sales} format="currency" />
            <StatCard title="Hours" am={dailyTotals.am.hours} pm={dailyTotals.pm.hours} total={dailyTotals.total.hours} format="hours" />
            <StatCard title="Labor Cost" am={dailyTotals.am.laborCost} pm={dailyTotals.pm.laborCost} total={dailyTotals.total.laborCost} format="currency" />
            <StatCard title="Labor %" am={dailyTotals.am.laborPercent} pm={dailyTotals.pm.laborPercent} total={dailyTotals.total.laborPercent} format="percent" />
          </div>

          {/* Special Events */}
          {specialEvents.length > 0 && (
            <div className="p-3 rounded-lg border space-y-2" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
               <h4 className="font-semibold text-sm blazin-text flex items-center gap-2">
                 <Sparkles className="w-4 h-4" style={{color: 'var(--brand-orange)'}} /> 
                 Special Events
               </h4>
               {specialEvents.map((event, idx) => (
                   <div key={idx} className="text-xs blazin-text-light pl-2 border-l-2" style={{borderColor: 'var(--brand-orange)'}}>
                     {event.name}
                     {event.start_time && ` • ${event.start_time}${event.end_time ? `-${event.end_time}` : ''}`}
                   </div>
               ))}
            </div>
          )}
        </div>

        {/* Column 2: AM/PM Shifts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* AM Shifts */}
            <div className="p-4 rounded-lg border flex flex-col" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg blazin-text">AM Shifts</h3>
                <Button variant="ghost" size="sm" onClick={() => handleCreateShift('am')} className="flex items-center gap-1 blazin-text">
                  <PlusCircle className="w-4 h-4" style={{color: 'var(--brand-orange)'}}/> Add
                </Button>
              </div>
              <div className="space-y-2">
                {amShifts.length > 0 ? (
                    amShifts.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(shift => (
                      <ShiftRow
                        key={shift.id}
                        shift={shift}
                        allData={allData}
                        onShiftsChange={onShiftsChange}
                        onShiftDelete={onShiftDelete}
                      />
                    ))
                ) : (
                    <p className="text-sm text-center py-4 blazin-text-light">No AM shifts scheduled.</p>
                )}
              </div>
            </div>

            {/* PM Shifts */}
            <div className="p-4 rounded-lg border flex flex-col" style={{backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)'}}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg blazin-text">PM Shifts</h3>
                <Button variant="ghost" size="sm" onClick={() => handleCreateShift('pm')} className="flex items-center gap-1 blazin-text">
                  <PlusCircle className="w-4 h-4" style={{color: 'var(--brand-orange)'}}/> Add
                </Button>
              </div>
              <div className="space-y-2">
                {pmShifts.length > 0 ? (
                    pmShifts.sort((a,b) => a.start_time.localeCompare(b.start_time)).map(shift => (
                      <ShiftRow
                        key={shift.id}
                        shift={shift}
                        allData={allData}
                        onShiftsChange={onShiftsChange}
                        onShiftDelete={onShiftDelete}
                      />
                    ))
                ) : (
                    <p className="text-sm text-center py-4 blazin-text-light">No PM shifts scheduled.</p>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}