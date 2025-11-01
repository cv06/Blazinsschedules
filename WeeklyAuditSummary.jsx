
import React from 'react';
import LaborPercentageMeter from '../analytics/LaborPercentageMeter';
import { DollarSign, Clock, Percent, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const timeToDecimal = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
};

const StatCard = ({ title, projected, actual, format }) => { // isPercent prop removed
    const difference = actual - projected;
    const isPositive = difference >= 0;
    let colorClass;

    if (title.includes('Labor') || title.includes('Percentage')) { // Labor Cost and Labor Percentage (includes 'Labor' or 'Percentage') are bad if positive difference
        colorClass = isPositive ? 'text-red-500' : 'text-green-500';
    } else { // For Sales, SPLH, etc., an increase is good (green)
        colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    }
    
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="bg-orange-50/50 p-4 rounded-xl text-center">
            <div className="text-sm font-semibold blazin-text mb-2">{title}</div>
            <div className="text-gray-500 text-xs">Projected: {format(projected)}</div>
            <div className="font-bold text-2xl blazin-text text-orange-600 my-1">{format(actual)}</div>
            <div className={`flex items-center justify-center text-xs font-medium ${colorClass}`}>
                <Icon className="w-3 h-3 mr-1"/>
                <span>{difference > 0 ? '+' : ''}{format(difference)}</span>
            </div>
        </div>
    );
};

export default function WeeklyAuditSummary({ data }) {
    const { schedule, sales, shifts, employees, settings } = data;
    const employeeMap = new Map(employees.map(e => [e.employee_id, e]));

    const projectedSales = schedule.total_projected_sales || 0;
    const actualSales = sales.reduce((sum, s) => sum + (s.actual_sales || 0), 0);
    
    const projectedLabor = schedule.total_labor_cost || 0;
    const actualLabor = shifts.reduce((sum, shift) => {
        const actualHours = Math.max(0, timeToDecimal(shift.actual_end_time) - timeToDecimal(shift.actual_start_time));
        const employee = employeeMap.get(shift.employee_id);
        return sum + (employee ? actualHours * employee.hourly_rate : 0);
    }, 0);

    const projectedLaborPercent = schedule.labor_percentage || 0;
    const actualLaborPercent = actualSales > 0 ? (actualLabor / actualSales) * 100 : 0;

    const projectedHours = shifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const actualHours = shifts.reduce((sum, s) => sum + Math.max(0, timeToDecimal(s.actual_end_time) - timeToDecimal(s.actual_start_time)), 0);

    const projectedSPLH = projectedSales > 0 && projectedHours > 0 ? projectedSales / projectedHours : 0;
    const actualSPLH = actualSales > 0 && actualHours > 0 ? actualSales / actualHours : 0;
    
    const formatCurrency = (val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    const formatPercent = (val) => `${val.toFixed(1)}%`;
    const formatSPLH = (val) => `$${val.toFixed(2)}`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
            <div className="lg:col-span-1 flex justify-center">
                <LaborPercentageMeter
                    currentPercentage={actualLaborPercent}
                    targetPercentage={settings?.target_labor_percentage || 0}
                />
            </div>
            <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Sales" projected={projectedSales} actual={actualSales} format={formatCurrency} />
                <StatCard title="Total Labor Cost" projected={projectedLabor} actual={actualLabor} format={formatCurrency} />
                <StatCard title="Labor Percentage" projected={projectedLaborPercent} actual={actualLaborPercent} format={formatPercent} />
                <StatCard title="Sales per Labor Hr" projected={projectedSPLH} actual={actualSPLH} format={formatSPLH} />
            </div>
        </div>
    );
}
