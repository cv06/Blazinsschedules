
import React from 'react';
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const StatCard = ({ icon: Icon, title, value }) => (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                <Icon className="w-6 h-6" style={{ color: 'var(--text-charcoal)' }} />
            </div>
            <div>
                <p className="text-sm font-medium" style={{ color: '#392F2D', opacity: 0.8 }}>{title}</p>
                <p className="text-2xl font-bold" style={{ color: '#392F2D' }}>{value}</p>
            </div>
        </div>
    </div>
);

export default function StatsCards({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" style={{backgroundColor: '#EADED2'}}/>)}
      </div>
    );
  }

  const cards = [
    {
      title: "Active Team",
      value: stats.activeEmployees,
      icon: Users,
    },
    {
      title: "Published Schedules",
      value: stats.publishedSchedules,
      icon: Calendar,
    },
    {
      title: "Weekly Sales",
      value: `$${stats.weekSalesTotal.toLocaleString()}`,
      icon: DollarSign,
    },
    {
      title: "Avg Labor %",
      value: `${stats.avgLaborPercentage}%`,
      icon: TrendingUp,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
