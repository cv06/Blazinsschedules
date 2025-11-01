
import React, { useState, useEffect, useCallback } from "react";
import { SalesProjection } from "@/api/entities";
import { WeeklySchedule } from "@/api/entities";
import { StoreSettings } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, addDays, subDays, isSameDay } from "date-fns";
import {
  TrendingUp,
  Save,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Zap,
  Cloud,
  Target,
  Plus,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog
} from "lucide-react";

import SpecialEventsManager from "../components/sales_projections/SpecialEventsManager";
import DailySalesGraph from "../components/sales_projections/DailySalesGraph";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SALES_CATEGORIES = ["lunch_sales", "midday_sales", "dinner_sales", "late_night_sales"];

const CATEGORY_LABELS = {
  lunch_sales: "Lunch",
  midday_sales: "Midday",
  dinner_sales: "Dinner",
  late_night_sales: "Late Night"
};

const getWeatherIcon = (description) => {
  const desc = description?.toLowerCase() || '';
  if (desc.includes('sunny') || desc.includes('clear')) return Sun;
  if (desc.includes('rain') || desc.includes('shower') || desc.includes('thunderstorm')) return CloudRain;
  if (desc.includes('snow')) return CloudSnow;
  if (desc.includes('fog') || desc.includes('mist')) return CloudFog;
  return Cloud; // Default for cloudy/overcast
};

export default function SalesProjections() {
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }));
  const [projections, setProjections] = useState([]);
  const [weather, setWeather] = useState([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [laborPercentage, setLaborPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (e) {
            setCurrentUser(null);
        }
    }
    fetchUser();
  }, []);

  const loadData = useCallback(async () => {
    if (!currentUser) {
        setIsLoading(true);
        return;
    }

    setIsLoading(true);
    setIsWeatherLoading(true);
    const formattedDate = format(weekStartDate, "yyyy-MM-dd");

    try {
      const [projectionsData, scheduleData, settingsData] = await Promise.all([
        SalesProjection.filter({ week_start_date: formattedDate, created_by: currentUser.email }),
        WeeklySchedule.filter({ week_start_date: formattedDate, created_by: currentUser.email }),
        StoreSettings.filter({ created_by: currentUser.email })
      ]);

      const projectionsArray = Array.isArray(projectionsData) ? projectionsData : [];
      const scheduleArray = Array.isArray(scheduleData) ? scheduleData : [];
      const settingsArray = Array.isArray(settingsData) ? settingsData : [];

      const projectionsWithEvents = projectionsArray.map(proj => ({
        ...proj,
        special_events: proj.special_events || []
      }));

      const storeLocation = settingsArray[0]?.location || "New York, NY";
      setLocation(storeLocation);
      setProjections(projectionsWithEvents);
      setLaborPercentage(scheduleArray[0]?.labor_percentage || 0);

      try {
        const specificWeekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStartDate, i), 'yyyy-MM-dd'));
        const weatherPrompt = `Provide a 7-day weather forecast for ${storeLocation} for these specific dates: ${specificWeekDates.join(', ')}. Ensure the response contains one forecast entry for each requested date.`;
        const weatherSchema = {
          type: "object",
          properties: {
            forecast: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  high_temp: { type: "number" },
                  low_temp: { type: "number" },
                  description: { type: "string" }
                },
                required: ["date", "high_temp", "low_temp", "description"]
              }
            }
          },
          required: ["forecast"]
        };
        const weatherResponse = await InvokeLLM({ prompt: weatherPrompt, add_context_from_internet: true, response_json_schema: weatherSchema });
        setWeather(weatherResponse.forecast || []);
      } catch (error) {
        console.error("Failed to fetch weather data:", error);
        setWeather([]);
      }

      setIsLoading(false);
      setIsWeatherLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      setIsLoading(false);
      setIsWeatherLoading(false);
    }
  }, [weekStartDate, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProjectionChange = (dayOfWeek, category, value) => {
    const numericValue = value === "" ? 0 : parseFloat(value);
    if (isNaN(numericValue)) return;

    setProjections((prev) => {
      const newProjections = [...prev];
      let dayProjection = newProjections.find((p) => p.day_of_week === dayOfWeek);

      if (dayProjection) {
        dayProjection[category] = numericValue;
      } else {
        dayProjection = {
          week_start_date: format(weekStartDate, "yyyy-MM-dd"),
          day_of_week: dayOfWeek,
          lunch_sales: 0,
          midday_sales: 0,
          dinner_sales: 0,
          late_night_sales: 0,
          special_events: [],
          created_by: currentUser?.email,
          [category]: numericValue
        };
        newProjections.push(dayProjection);
      }

      dayProjection.total_daily_sales = SALES_CATEGORIES.reduce((total, cat) => total + (dayProjection[cat] || 0), 0);
      return newProjections;
    });
  };

  const getProjectionValue = (dayOfWeek, category) => {
    const proj = projections.find((p) => p.day_of_week === dayOfWeek);
    return proj?.[category] || "";
  };

  const getDailyTotal = (dayOfWeek) => {
    const proj = projections.find((p) => p.day_of_week === dayOfWeek);
    return proj?.total_daily_sales || 0;
  };

  const weeklyTotal = projections.reduce((total, proj) => total + (proj.total_daily_sales || 0), 0);

  const saveProjections = useCallback(async (shouldPublish = false) => {
    if (!currentUser) return;

    const formattedDate = format(weekStartDate, "yyyy-MM-dd");
    const existingProjections = await SalesProjection.filter({ week_start_date: formattedDate, created_by: currentUser.email });

    await Promise.all(
      DAYS_OF_WEEK.map(async (day) => {
        const currentProjectionForDay = projections.find((p) => p.day_of_week === day);

        const dayData = {
          week_start_date: formattedDate,
          day_of_week: day,
          lunch_sales: currentProjectionForDay?.lunch_sales || 0,
          midday_sales: currentProjectionForDay?.midday_sales || 0,
          dinner_sales: currentProjectionForDay?.dinner_sales || 0,
          late_night_sales: currentProjectionForDay?.late_night_sales || 0,
          special_events: currentProjectionForDay?.special_events || [],
          created_by: currentUser.email,
        };
        dayData.total_daily_sales = SALES_CATEGORIES.reduce((total, cat) => total + (dayData[cat] || 0), 0);

        const existing = existingProjections.find((p) => p.day_of_week === day);
        if (existing) {
          await SalesProjection.update(existing.id, dayData);
        } else {
          await SalesProjection.create(dayData);
        }
      })
    );

    const [schedule] = await WeeklySchedule.filter({ week_start_date: formattedDate, created_by: currentUser.email });

    const weeklyScheduleData = {
      week_start_date: formattedDate,
      total_projected_sales: weeklyTotal,
      schedule_name: `Week of ${formattedDate}`,
      is_published: shouldPublish,
      created_by: currentUser.email,
    };

    if (schedule) {
      await WeeklySchedule.update(schedule.id, weeklyScheduleData);
    } else {
      await WeeklySchedule.create(weeklyScheduleData);
    }
  }, [currentUser, weekStartDate, projections, weeklyTotal]);

  useEffect(() => {
    if (!currentUser || projections.length === 0) return;

    const autoSaveTimer = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await saveProjections(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
      setIsAutoSaving(false);
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [projections, currentUser, saveProjections]);

  const handlePublish = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await saveProjections(true);
    } catch (error) {
      console.error('Publish failed:', error);
    }
    setIsSaving(false);
  };

  const changeWeek = (direction) => {
    setWeekStartDate((current) => direction === 'next' ? addDays(current, 7) : subDays(current, 7));
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
  const alignedWeather = weekDates.map(date => {
    const formattedDateStr = format(date, 'yyyy-MM-dd');
    const foundWeather = weather.find(w => w.date === formattedDateStr);
    return foundWeather || {
      date: formattedDateStr,
      description: 'N/A',
      high_temp: '–',
      low_temp: '–'
    };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EADED2' }}>
      {/* Header Bar */}
      <div className="px-6 py-8 mb-6" style={{ 
        backgroundColor: '#E16B2A',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px'
      }}>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#FFF2E2' }}>
              Sales Projections
            </h1>
            <p className="text-sm mt-1" style={{ color: '#FFF2E2', opacity: 0.9 }}>
              Plan your week's sales to build better schedules
            </p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{
            backgroundColor: 'rgba(255, 242, 226, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => changeWeek('prev')}
              style={{ color: '#FFF2E2' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="font-semibold text-base whitespace-nowrap" style={{ color: '#FFF2E2' }}>
              Week of {format(weekStartDate, "MMMM d, yyyy")}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => changeWeek('next')}
              style={{ color: '#FFF2E2' }}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-40 space-y-6">
        {/* Top Row: Weather + Quick Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 7 Day Weather - Takes 2 columns */}
          <Card className="lg:col-span-2" style={{ backgroundColor: '#FFF2E2', border: '1px solid #392F2D', borderRadius: '20px' }}>
            <CardHeader>
              <CardTitle className="text-lg font-bold" style={{ color: '#392F2D' }}>
                7-Day Forecast
              </CardTitle>
              <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>Forecast for {location}</p>
            </CardHeader>
            <CardContent>
              {isWeatherLoading ? (
                <div className="flex gap-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 flex-1" style={{ backgroundColor: '#EADED2' }} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {alignedWeather.map((item, index) => {
                    const WeatherIcon = getWeatherIcon(item.description);
                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center justify-center p-3 rounded-xl"
                        style={{ backgroundColor: '#EADED2' }}
                      >
                        <div className="text-xs font-semibold mb-2" style={{ color: '#392F2D' }}>
                          {format(weekDates[index], 'EEE')}
                        </div>
                        <WeatherIcon className="w-8 h-8 mb-2" style={{ color: '#E16B2A' }} />
                        <div className="text-xs text-center" style={{ color: '#392F2D', opacity: 0.7 }}>
                          {item.high_temp}° / {item.low_temp}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics - Takes 1 column */}
          <Card style={{ backgroundColor: '#FFF2E2', border: '1px solid #392F2D', borderRadius: '20px' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold" style={{ color: '#392F2D' }}>
                Quick Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#EADED2', border: '1px solid #392F2D' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(225, 107, 42, 0.2)' }}>
                      <DollarSign className="w-4 h-4" style={{ color: '#E16B2A' }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#392F2D' }}>
                        ${(weeklyTotal / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>
                        Total Weekly Sales
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 rounded-xl" style={{ backgroundColor: '#EADED2', border: '1px solid #392F2D' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(225, 107, 42, 0.2)' }}>
                      <Zap className="w-4 h-4" style={{ color: '#E16B2A' }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ color: '#392F2D' }}>
                        {laborPercentage.toFixed(1)}%
                      </div>
                      <div className="text-xs" style={{ color: '#392F2D', opacity: 0.7 }}>
                        Est. Labor
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Band: Weekly Sales Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFF2E2', border: '1px solid #392F2D' }}>
          {/* Title Section */}
          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold" style={{ color: '#392F2D' }}>Weekly Sales</h2>
          </div>

          {/* Table Section with Dark Beige Background */}
          <div className="px-6 pb-2">
            <div className="p-4 rounded-xl" style={{ backgroundColor: '#EADED2' }}>
              <div className="overflow-x-auto">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-3 mb-4">
                  <div></div>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <div 
                      key={day} 
                      className="p-3 rounded-xl text-center"
                      style={{ backgroundColor: '#FFF2E2' }}
                    >
                      <div className="font-bold text-sm" style={{ color: '#392F2D' }}>
                        {day.substring(0, 3).toUpperCase()}
                      </div>
                      <div className="text-xs mt-1" style={{ color: '#392F2D', opacity: 0.7 }}>
                        {format(addDays(weekStartDate, index), 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meal Period Rows */}
                <div className="space-y-2">
                  {SALES_CATEGORIES.map((category, catIndex) => (
                    <div 
                      key={category} 
                      className="grid grid-cols-8 gap-3 items-center py-2 px-2 rounded-lg"
                    >
                      <div className="font-semibold text-sm" style={{ color: '#392F2D' }}>
                        {CATEGORY_LABELS[category]}
                      </div>
                      {DAYS_OF_WEEK.map((day) => (
                        <Input
                          key={`${day}-${category}`}
                          type="number"
                          placeholder="0"
                          value={getProjectionValue(day, category)}
                          onChange={(e) => handleProjectionChange(day, category, e.target.value)}
                          className="text-center font-semibold text-sm border-0"
                          style={{
                            backgroundColor: '#FFF2E2',
                            color: '#392F2D',
                            borderRadius: '8px'
                          }}
                          disabled={isLoading || !currentUser}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Totals Bar - Light Beige Background */}
          <div className="px-6 pb-6">
            <div className="pt-4" style={{ borderTop: '2px solid #392F2D' }}>
              <div className="flex items-center gap-3">
                <div className="font-bold text-sm" style={{ color: '#392F2D' }}>
                  Daily Totals
                </div>
                <div className="flex gap-2 flex-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const dailyTotal = getDailyTotal(day);
                    return (
                      <div 
                        key={`${day}-total`}
                        className="flex-1 text-center py-2 px-3 rounded-full font-bold text-sm"
                        style={{
                          backgroundColor: '#E16B2A',
                          color: '#FFF2E2'
                        }}
                      >
                        ${(dailyTotal / 1000).toFixed(1)}k
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Special Events */}
        <SpecialEventsManager
          projections={projections}
          onProjectionsChange={setProjections}
          weekStartDate={weekStartDate}
        />

        {/* Weekly Sales Trends Graph */}
        <Card style={{ backgroundColor: '#FFF2E2', border: '1px solid #392F2D', borderRadius: '20px' }}>
          <CardHeader>
            <CardTitle className="text-lg font-bold" style={{ color: '#392F2D' }}>
              Weekly Sales Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DailySalesGraph projections={projections} weekStartDate={weekStartDate} />
          </CardContent>
        </Card>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 px-4 py-4 md:pl-[280px]"
        style={{ 
          backgroundColor: '#E16B2A',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <div className="text-xs font-medium" style={{ color: 'rgba(255, 242, 226, 0.8)' }}>
                Total Weekly Sales
              </div>
              <div className="text-lg sm:text-xl font-bold" style={{ color: '#FFF2E2' }}>
                ${weeklyTotal.toLocaleString()}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xs font-medium" style={{ color: 'rgba(255, 242, 226, 0.8)' }}>
                Est. Labor %
              </div>
              <div className="text-lg sm:text-xl font-bold" style={{ color: '#FFF2E2' }}>
                {laborPercentage.toFixed(2)}%
              </div>
            </div>
          </div>

          <Button
            onClick={handlePublish}
            disabled={isSaving || isLoading || !currentUser}
            className="px-5 py-4 text-sm sm:text-base font-semibold rounded-xl whitespace-nowrap w-full sm:w-auto"
            style={{
              backgroundColor: '#de6a2b',
              color: '#FFF2E2'
            }}
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {isSaving ? "Publishing..." : "Publish Projections"}
            {isAutoSaving && <span className="ml-2 text-xs opacity-75">(Auto-saving...)</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
