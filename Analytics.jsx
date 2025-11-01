
import React, { useState, useEffect, useMemo } from "react";
import { WeeklySchedule } from "@/api/entities";
import { Shift } from "@/api/entities";
import { SalesProjection } from "@/api/entities";
import { StoreSettings } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, parse } from "date-fns";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Clock, Users, Percent } from "lucide-react";

import LaborVarianceChart from "../components/analytics/LaborVarianceChart";
import PositionDistributionChart from "../components/analytics/PositionDistributionChart";
import LaborByHourChart from "../components/analytics/LaborByHourChart";
import DailyPerformanceChart from "../components/analytics/DailyPerformanceChart";

const KPI_Card = ({ title, value, variance, icon: Icon, format = "currency" }) => {
    const isPositive = variance >= 0;
    const isZero = variance === 0 || isNaN(variance) || !isFinite(variance);

    const formatValue = (val) => {
        if (!val && val !== 0) return "$0";
        if (format === 'currency') return `$${val.toLocaleString()}`;
        if (format === 'hours') return `${val.toLocaleString()} hrs`;
        if (format === 'percentage') return `${val.toFixed(2)}%`;
        return val.toLocaleString();
    };

    return (
        <Card className="border" style={{ backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium blazin-text-light">{title}</CardTitle>
                <Icon className="h-5 w-5 blazin-text" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold blazin-text">{formatValue(value || 0)}</div>
                {!isZero && (
                    <div className="flex items-center text-xs">
                        <span className="flex items-center" style={{ color: 'var(--text-charcoal)' }}>
                            {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                            {Math.abs(variance).toFixed(2)}%
                        </span>
                        <span className="blazin-text-light ml-1">vs. last week</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function Analytics() {
    const [publishedSchedules, setPublishedSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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

    useEffect(() => {
        if (!currentUser) return;
        const loadSchedules = async () => {
            try {
                const schedules = await WeeklySchedule.filter({ is_published: true, created_by: currentUser.email }, "-week_start_date", 20);
                setPublishedSchedules(schedules || []);
                if (schedules && schedules.length > 0) {
                    setSelectedScheduleId(schedules[0].id);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error loading schedules:', error);
                setPublishedSchedules([]);
                setIsLoading(false);
            }
        };
        loadSchedules();
    }, [currentUser]);

    useEffect(() => {
        if (!selectedScheduleId || !currentUser) return;

        const loadAnalyticsData = async () => {
            setIsLoading(true);

            try {
                const schedule = publishedSchedules.find(s => s.id === selectedScheduleId);
                if (!schedule) {
                    setIsLoading(false);
                    return;
                }
                
                const prevWeekStartDate = format(subDays(parse(schedule.week_start_date, 'yyyy-MM-dd', new Date()), 7), 'yyyy-MM-dd');
                const [prevSchedule] = await WeeklySchedule.filter({ week_start_date: prevWeekStartDate, is_published: true, created_by: currentUser.email }) || [];

                const [shifts, sales, settings] = await Promise.all([
                    Shift.filter({ schedule_id: schedule.id }),
                    SalesProjection.filter({ week_start_date: schedule.week_start_date, created_by: currentUser.email }),
                    StoreSettings.list()
                ]);

                setAnalyticsData({
                    schedule,
                    shifts: shifts || [],
                    sales: sales || [],
                    settings: (settings && settings[0]) || {},
                    prevSchedule
                });
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading analytics data:', error);
                setIsLoading(false);
            }
        };

        loadAnalyticsData();
    }, [selectedScheduleId, publishedSchedules, currentUser]);

    const kpis = useMemo(() => {
        if (!analyticsData || !analyticsData.schedule) return {
            totalSales: { value: 0, variance: 0 },
            actualLabor: { value: 0, variance: 0 },
            actualLaborPercent: { value: 0, variance: 0 },
            totalHours: { value: 0, variance: 0 }
        };
        
        const { schedule, prevSchedule, shifts } = analyticsData;

        const getVariance = (current, previous) => {
            if (!previous || previous === 0) return 0;
            return ((current - previous) / previous) * 100;
        };

        return {
            totalSales: {
                value: schedule.total_projected_sales || 0,
                variance: getVariance(schedule.total_projected_sales, prevSchedule?.total_projected_sales),
            },
            actualLabor: {
                value: schedule.actual_labor_cost || 0,
                variance: getVariance(schedule.actual_labor_cost, prevSchedule?.actual_labor_cost),
            },
            actualLaborPercent: {
                value: schedule.actual_labor_percentage || 0,
                variance: getVariance(schedule.actual_labor_percentage, prevSchedule?.actual_labor_percentage),
            },
            totalHours: {
                value: (shifts || []).reduce((sum, s) => sum + (s.hours || 0), 0),
                variance: 0,
            }
        };
    }, [analyticsData]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" style={{backgroundColor: 'var(--bg-divider)'}} />)}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Skeleton className="h-80" style={{backgroundColor: 'var(--bg-divider)'}} />
                        <Skeleton className="h-80" style={{backgroundColor: 'var(--bg-divider)'}} />
                        <Skeleton className="h-80" style={{backgroundColor: 'var(--bg-divider)'}} />
                        <Skeleton className="h-80" style={{backgroundColor: 'var(--bg-divider)'}} />
                    </div>
                </>
            );
        }

        if (!analyticsData || publishedSchedules.length === 0) {
            return (
                <div className="text-center py-20">
                    <BarChart3 className="mx-auto h-12 w-12" style={{color: 'var(--bg-divider)'}} />
                    <h3 className="mt-2 text-lg font-medium blazin-text">No Analytics Data</h3>
                    <p className="mt-1 text-sm blazin-text-light">Publish a schedule and run a labor audit to see analytics.</p>
                </div>
            );
        }

        return (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPI_Card title="Total Sales" value={kpis.totalSales.value} variance={kpis.totalSales.variance} icon={DollarSign} />
                    <KPI_Card title="Actual Labor Cost" value={kpis.actualLabor.value} variance={kpis.actualLabor.variance} icon={DollarSign} />
                    <KPI_Card title="Actual Labor %" value={kpis.actualLaborPercent.value} variance={kpis.actualLaborPercent.variance} icon={Percent} format="percentage" />
                    <KPI_Card title="Total Hours" value={kpis.totalHours.value} variance={0} icon={Clock} format="hours" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                        <CardHeader>
                            <CardTitle className="blazin-text">Daily Sales vs Labor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DailyPerformanceChart data={analyticsData} />
                        </CardContent>
                    </Card>
                    <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                        <CardHeader>
                            <CardTitle className="blazin-text">Projected vs Actual Labor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LaborVarianceChart data={analyticsData} />
                        </CardContent>
                    </Card>
                    <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                        <CardHeader>
                            <CardTitle className="blazin-text">Labor by Hour</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <LaborByHourChart data={analyticsData} />
                        </CardContent>
                    </Card>
                    <Card className="border" style={{backgroundColor: 'var(--bg-module)', borderColor: 'var(--text-charcoal)'}}>
                        <CardHeader>
                            <CardTitle className="blazin-text">Shifts by Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PositionDistributionChart data={analyticsData} />
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    return (
        <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="p-6 rounded-lg border" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3 blazin-text">
                                <BarChart3 className="w-8 h-8" />
                                Performance Analytics
                            </h1>
                            <p className="mt-1" style={{ color: '#392F2D', opacity: 0.8 }}>Insights into your labor and sales performance.</p>
                        </div>
                        <div className="w-full md:w-auto">
                           <Select value={selectedScheduleId || ""} onValueChange={setSelectedScheduleId} disabled={publishedSchedules.length === 0}>
                                <SelectTrigger className="w-full md:w-[280px] border h-12" style={{borderColor: 'var(--text-charcoal)', backgroundColor: 'var(--bg-module)'}}>
                                    <SelectValue placeholder="Select a week to analyze..." />
                                </SelectTrigger>
                                <SelectContent style={{backgroundColor: 'var(--bg-module)'}}>
                                    {publishedSchedules.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.schedule_name || `Week of ${format(parse(s.week_start_date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}
