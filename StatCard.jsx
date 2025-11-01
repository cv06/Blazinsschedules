import React from 'react';

const formatValue = (value, format) => {
    switch (format) {
        case 'currency':
            return `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'hours':
            return `${(value || 0).toFixed(2)}h`;
        case 'percent':
            return `${(value || 0).toFixed(2)}%`;
        case 'variance':
            const sign = value > 0 ? '+' : '';
            const color = value === 0 ? 'var(--text-charcoal)' : value > 0 ? 'var(--brand-orange)' : 'var(--text-charcoal)';
            return <span style={{color}}>{`${sign}${(value || 0).toFixed(2)}h`}</span>;
        default:
            return value;
    }
};

export default function StatCard({ title, am, pm, total, format }) {
    return (
        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-divider)', borderColor: 'var(--text-charcoal)' }}>
            <h4 className="font-semibold text-sm blazin-text mb-2">{title}</h4>
            <div className="grid grid-cols-3 gap-1 text-center text-xs">
                <div>
                    <div className="font-bold text-sm blazin-text">{formatValue(am, format)}</div>
                    <div className="blazin-text-light opacity-70">AM</div>
                </div>
                <div>
                    <div className="font-bold text-sm blazin-text">{formatValue(pm, format)}</div>
                    <div className="blazin-text-light opacity-70">PM</div>
                </div>
                <div className="p-1 rounded" style={{backgroundColor: 'var(--bg-module)'}}>
                    <div className="font-bold text-sm blazin-text">{formatValue(total, format)}</div>
                    <div className="blazin-text-light opacity-70">TOTAL</div>
                </div>
            </div>
        </div>
    );
}