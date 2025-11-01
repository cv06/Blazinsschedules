
import React from 'react';
import { DollarSign, Clock, Percent, Zap } from 'lucide-react';

const SummaryStat = ({ icon: Icon, label, value, subValue, iconColor }) => (
    <div className="flex items-center gap-4">
        <Icon className={`w-7 h-7`} style={{color: iconColor || 'var(--brand-orange)'}} />
        <div>
            <div className="text-sm blazin-text-light">{label}</div>
            <div className="text-xl font-bold blazin-text">{value}</div>
            {subValue && <div className="text-xs blazin-text-light opacity-70">{subValue}</div>}
        </div>
    </div>
);

export default function WeeklySummary({ totals, targetLabor }) {
    const { 
      totalSales, 
      totalHours, 
      laborPercentage,
      salesPerLaborHour,
      preOpenHours,
      postCloseHours
    } = totals;
    
    const laborDiff = laborPercentage - targetLabor;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 items-start">
            <SummaryStat
                icon={DollarSign}
                label="Total Projected Sales"
                value={`$${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <SummaryStat
                icon={Clock}
                label="Total Scheduled Hours"
                value={totalHours.toFixed(1)}
                subValue={`Open/Close: ${preOpenHours.toFixed(1)}h / ${postCloseHours.toFixed(1)}h`}
            />
            <SummaryStat
                icon={Percent}
                label="Projected Labor %"
                value={`${laborPercentage.toFixed(2)}%`}
                subValue={targetLabor > 0 ? `Target: ${targetLabor.toFixed(2)}%` : ''}
                iconColor={targetLabor > 0 && laborDiff > 0.5 ? 'var(--brand-orange)' : 'var(--text-charcoal)'}
            />
            <SummaryStat
                icon={Zap}
                label="Sales per Labor Hour"
                value={`$${salesPerLaborHour.toFixed(2)}`}
                iconColor={'var(--brand-orange)'}
            />
        </div>
    );
}
