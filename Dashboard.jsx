
import React, { useState, useEffect, useCallback } from "react";
import { Employee, WeeklySchedule, SalesProjection, StoreSettings, Shift, Availability, TimeOffRequest, User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Flame, 
  Plus, 
  Clock, 
  FileText,
  Eye,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  CloudSun,
  DollarSign,
  Target,
  Zap,
  ArrowRight,
  Activity,
  TrendingDown
} from "lucide-react";
import { format, startOfWeek, addDays, subDays } from "date-fns";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [currentWeekSales, setCurrentWeekSales] = useState([]);
  const [weather, setWeather] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [todaysShifts, setTodaysShifts] = useState([]);
  const [tomorrowsShifts, setTomorrowsShifts] = useState([]);
  const [pendingTimeOff, setPendingTimeOff] = useState(0);
  const [unassignedShifts, setUnassignedShifts] = useState(0);
  const [availabilityConflicts, setAvailabilityConflicts] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        console.error("Failed to fetch current user:", e);
      }
    };
    fetchUser();
  }, []);

  const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    } catch {
      return 0;
    }
  };

  const formatTime = (timeStr) => {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const period = h >= 12 ? 'pm' : 'am';
    const adjustedHour = h % 12 || 12;
    return `${adjustedHour}:${minute}${period}`;
  };

  const loadWeatherForecast = useCallback(async (storeSettings) => {
    setIsWeatherLoading(true);
    const location = storeSettings?.location || "New York, NY";

    try {
      const weatherPrompt = `Provide a 7-day weather forecast starting from today (${format(new Date(), "MMMM d, yyyy")}) for ${location}. Include high and low temperatures and weather descriptions.`;
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
              }
            }
          }
        }
      };
      
      const weatherResponse = await InvokeLLM({ 
        prompt: weatherPrompt, 
        add_context_from_internet: true, 
        response_json_schema: weatherSchema 
      });
      
      setWeather(weatherResponse.forecast || []);
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      setWeather([]);
    }
    setIsWeatherLoading(false);
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');
    const currentWeekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [
      employeesData,
      schedulesData,
      currentWeekSalesData,
      settingsData,
      pendingTimeOffData,
      availabilityData,
    ] = await Promise.all([
      Employee.filter({ is_active: true, created_by: currentUser.email }),
      WeeklySchedule.filter({ created_by: currentUser.email }, "-week_start_date", 10),
      SalesProjection.filter({ week_start_date: currentWeekStartStr, created_by: currentUser.email }),
      StoreSettings.filter({ created_by: currentUser.email }),
      TimeOffRequest.filter({ status: 'pending', created_by: currentUser.email }),
      Availability.filter({ created_by: currentUser.email }),
    ]);

    const scheduleIds = schedulesData.map(s => s.id);
    const allShiftsForUser = scheduleIds.length > 0 
      ? await Shift.filter({ schedule_id: { $in: scheduleIds }, created_by: currentUser.email })
      : [];

    const publishedScheduleIds = schedulesData.filter(s => s.is_published).map(s => s.id);
    const allPublishedShifts = allShiftsForUser.filter(s => publishedScheduleIds.includes(s.schedule_id) && s.employee_id);

    const timeOffRequests = await TimeOffRequest.filter({ 
      status: 'approved', 
      created_by: currentUser.email 
    });

    const timeOffMap = new Map();
    timeOffRequests.forEach(req => {
      let currentDate = new Date(req.start_date + 'T00:00:00');
      const endDate = new Date(req.end_date + 'T00:00:00');
      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        if (!timeOffMap.has(`${req.employee_id}-${dateKey}`)) {
          timeOffMap.set(`${req.employee_id}-${dateKey}`, []);
        }
        timeOffMap.get(`${req.employee_id}-${dateKey}`).push(req);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    const availabilityConflictsData = [];
    const employeeMap = new Map(employeesData.map(e => [e.employee_id, e]));
    const availabilityMap = new Map(availabilityData.map(a => [`${a.employee_id}-${a.day_of_week}`, a]));

    for (const shift of allPublishedShifts) {
      const employee = employeeMap.get(shift.employee_id);
      if (!employee) continue;

      let conflictReason = '';
      
      const timeOffForShift = timeOffMap.get(`${shift.employee_id}-${shift.date}`) || [];
      for (const timeOffReq of timeOffForShift) {
        if (timeOffReq.is_all_day) {
          conflictReason = `Time off (All Day): ${timeOffReq.reason}`;
          break;
        } else if (timeOffReq.start_time && timeOffReq.end_time) {
          const shiftStart = timeToDecimal(shift.start_time);
          const shiftEnd = timeToDecimal(shift.end_time);
          const timeOffStart = timeToDecimal(timeOffReq.start_time);
          const timeOffEnd = timeToDecimal(timeOffReq.end_time);
          
          const hasOverlap = !(shiftEnd <= timeOffStart || shiftStart >= timeOffEnd);
          if (hasOverlap) {
            conflictReason = `Time off (${formatTime(timeOffReq.start_time)}-${formatTime(timeOffReq.end_time)}): ${timeOffReq.reason}`;
            break;
          }
        }
      }

      if (!conflictReason) {
        const employeePositions = employee.positions || [];
        const shiftPositions = shift.position || [];
        const hasMatchingPosition = shiftPositions.some(p => employeePositions.includes(p));

        if (shiftPositions.length > 0 && !hasMatchingPosition) {
          conflictReason = `Mismatched position (Needs: ${shiftPositions.join('/')})`;
        }
      }

      if (!conflictReason) {
        const dayOfWeek = format(new Date(shift.date + 'T00:00:00'), 'eeee').toLowerCase();
        const avail = availabilityMap.get(`${employee.employee_id}-${dayOfWeek}`);
        
        if (!avail || !avail.is_available) {
          conflictReason = 'Not available on this day';
        } else {
          const shiftStart = timeToDecimal(shift.start_time);
          const shiftEnd = timeToDecimal(shift.end_time);
          const availStart = timeToDecimal(avail.start_time);
          const availEnd = timeToDecimal(avail.end_time);
          if (shiftStart < availStart || shiftEnd > availEnd) {
            conflictReason = `Available ${formatTime(avail.start_time)}-${formatTime(avail.end_time)}`;
          }
        }
      }

      if (conflictReason) {
        availabilityConflictsData.push({
          employeeName: `${employee.first_name} ${employee.last_name}`,
          shiftDate: shift.date,
          shiftTime: `${shift.start_time} - ${shift.end_time}`,
          position: Array.isArray(shift.position) ? shift.position.join(' / ') : shift.position,
          reason: conflictReason,
        });
      }
    }

    const todaysShiftsData = allPublishedShifts.filter(s => s.date === todayStr);
    const tomorrowsShiftsData = allPublishedShifts.filter(s => s.date === tomorrowStr);
    const unassignedShiftsCount = allPublishedShifts.filter(s => !s.employee_id).length;

    setEmployees(employeesData);
    setSchedules(schedulesData);
    setCurrentWeekSales(currentWeekSalesData);
    setSettings(settingsData[0] || null);
    setTodaysShifts(todaysShiftsData);
    setTomorrowsShifts(tomorrowsShiftsData);
    setPendingTimeOff(pendingTimeOffData.length);
    setUnassignedShifts(unassignedShiftsCount);
    setAvailabilityConflicts(availabilityConflictsData);
    
    setIsLoading(false);

    if (settingsData[0]) {
      loadWeatherForecast(settingsData[0]);
    }
  }, [currentUser, loadWeatherForecast]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, loadDashboardData]);

  const getStats = () => {
    const activeEmployees = employees.filter(emp => emp.is_active).length;
    const publishedSchedules = schedules.filter(sch => sch.is_published).length;
    const weekSalesTotal = currentWeekSales.reduce((sum, day) => sum + (day.total_daily_sales || 0), 0);
    const avgLaborPercentage = schedules.length > 0 
      ? (schedules.reduce((sum, sch) => sum + (sch.labor_percentage || 0), 0) / schedules.length).toFixed(1)
      : 0;

    return {
      activeEmployees,
      publishedSchedules,
      weekSalesTotal,
      avgLaborPercentage
    };
  };

  const stats = getStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate schedule completion percentage
  const getScheduleCompletion = () => {
    if (schedules.length === 0) return 0;
    const latestSchedule = schedules[0];
    const scheduleShifts = todaysShifts.filter(s => s.schedule_id === latestSchedule?.id);
    const assignedShifts = scheduleShifts.filter(s => s.employee_id).length;
    return scheduleShifts.length > 0 ? Math.round((assignedShifts / scheduleShifts.length) * 100) : 0;
  };

  if (!currentUser && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#de6a2b' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-300 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#FFF2E2' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EADED2' }}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Hero Header - Gradient Card */}
        <div className="relative overflow-hidden rounded-2xl p-8" style={{ 
          background: 'linear-gradient(135deg, #E16B2A 0%, #de6a2b 50%, #d4a98a 100%)',
          boxShadow: '0 4px 20px rgba(225, 107, 42, 0.3)'
        }}>
          {/* Flame Watermark */}
          <div className="absolute top-4 right-4 opacity-[0.08]">
            <Flame className="w-48 h-48" style={{ color: '#FFF2E2' }} />
          </div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#FFF2E2' }}>
                {getGreeting()}, {currentUser?.full_name?.split(' ')[0]}!
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-lg" style={{ color: '#FFF2E2', opacity: 0.9 }}>
                  {settings?.store_name || "Blazin' Schedules"}
                </p>
                <span style={{ color: '#FFF2E2', opacity: 0.6 }}>•</span>
                <p className="text-lg" style={{ color: '#FFF2E2', opacity: 0.9 }}>
                  {format(new Date(), 'EEEE, MMMM do')}
                </p>
                {!isWeatherLoading && weather.length > 0 && (
                  <>
                    <span style={{ color: '#FFF2E2', opacity: 0.6 }}>•</span>
                    <div className="flex items-center gap-2">
                      <CloudSun className="w-5 h-5" style={{ color: '#FFF2E2', opacity: 0.9 }} />
                      <p className="text-lg" style={{ color: '#FFF2E2', opacity: 0.9 }}>
                        {weather[0]?.high_temp}°F
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Metrics Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Link to={createPageUrl("Employees")} className="group">
                <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ 
                  backgroundColor: 'rgba(255, 242, 226, 0.15)',
                  borderLeft: '3px solid #FFF2E2'
                }}>
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6" style={{ color: '#FFF2E2' }} />
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#FFF2E2' }}>{stats.activeEmployees}</p>
                      <p className="text-sm" style={{ color: '#FFF2E2', opacity: 0.8 }}>Active Team</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl("PublishedSchedules")} className="group">
                <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ 
                  backgroundColor: 'rgba(255, 242, 226, 0.15)',
                  borderLeft: '3px solid #FFF2E2'
                }}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6" style={{ color: '#FFF2E2' }} />
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#FFF2E2' }}>{stats.publishedSchedules}</p>
                      <p className="text-sm" style={{ color: '#FFF2E2', opacity: 0.8 }}>Published</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl("SalesProjections")} className="group">
                <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ 
                  backgroundColor: 'rgba(255, 242, 226, 0.15)',
                  borderLeft: '3px solid #FFF2E2'
                }}>
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6" style={{ color: '#FFF2E2' }} />
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#FFF2E2' }}>${(stats.weekSalesTotal / 1000).toFixed(0)}k</p>
                      <p className="text-sm" style={{ color: '#FFF2E2', opacity: 0.8 }}>Week Sales</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to={createPageUrl("Analytics")} className="group">
                <div className="p-4 rounded-xl transition-all duration-300 hover:scale-105" style={{ 
                  backgroundColor: 'rgba(255, 242, 226, 0.15)',
                  borderLeft: '3px solid #FFF2E2'
                }}>
                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6" style={{ color: '#FFF2E2' }} />
                    <div>
                      <p className="text-2xl font-bold" style={{ color: '#FFF2E2' }}>{stats.avgLaborPercentage}%</p>
                      <p className="text-sm" style={{ color: '#FFF2E2', opacity: 0.8 }}>Labor %</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to={createPageUrl("ScheduleBuilder")} className="group">
            <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ 
              backgroundColor: '#FFF2E2', 
              borderRadius: '16px',
              border: '1px solid #392F2D',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#E16B2A' }}>
                    <Clock className="w-8 h-8" style={{ color: '#FFF2E2' }} />
                  </div>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" style={{ color: '#E16B2A' }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#392F2D' }}>
                  Build Schedule
                </h3>
                <p className="mb-4" style={{ color: '#392F2D', opacity: 0.7 }}>
                  Create and assign shifts
                </p>
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#392F2D', opacity: 0.7 }}>Current Week</span>
                    <span className="font-bold" style={{ color: '#E16B2A' }}>{getScheduleCompletion()}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#EADED2' }}>
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${getScheduleCompletion()}%`,
                        backgroundColor: '#E16B2A'
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("SalesProjections")} className="group">
            <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ 
              backgroundColor: '#FFF2E2', 
              borderRadius: '16px',
              border: '1px solid #392F2D',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#E16B2A' }}>
                    <TrendingUp className="w-8 h-8" style={{ color: '#FFF2E2' }} />
                  </div>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" style={{ color: '#E16B2A' }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#392F2D' }}>
                  Sales Planning
                </h3>
                <p className="mb-4" style={{ color: '#392F2D', opacity: 0.7 }}>
                  Project weekly sales
                </p>
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {currentWeekSales.length > 0 ? (
                    <>
                      <CheckCircle className="w-4 h-4" style={{ color: '#E16B2A' }} />
                      <span className="text-sm font-medium" style={{ color: '#E16B2A' }}>Projections Published</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
                      <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>Pending Projections</span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("PublishedSchedules")} className="group">
            <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-xl" style={{ 
              backgroundColor: '#FFF2E2', 
              borderRadius: '16px',
              border: '1px solid #392F2D',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#E16B2A' }}>
                    <Eye className="w-8 h-8" style={{ color: '#FFF2E2' }} />
                  </div>
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" style={{ color: '#E16B2A' }} />
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#392F2D' }}>
                  View Schedules
                </h3>
                <p className="mb-4" style={{ color: '#392F2D', opacity: 0.7 }}>
                  See published weeks
                </p>
                {/* Active Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full w-fit" style={{ backgroundColor: '#EADED2' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#392F2D' }} />
                  <span className="text-sm font-medium" style={{ color: '#392F2D' }}>
                    {stats.publishedSchedules} Active Schedule{stats.publishedSchedules !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Operations Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts / Needs Attention */}
          <Card style={{ 
            backgroundColor: '#FFF2E2', 
            borderRadius: '16px',
            border: '1px solid #392F2D',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${availabilityConflicts.length > 0 || pendingTimeOff > 0 || unassignedShifts > 0 ? 'animate-pulse' : ''}`} style={{ 
                  backgroundColor: 'rgba(225, 107, 42, 0.2)'
                }}>
                  {availabilityConflicts.length > 0 || pendingTimeOff > 0 || unassignedShifts > 0 ? (
                    <Flame className="w-6 h-6" style={{ color: '#E16B2A' }} />
                  ) : (
                    <CheckCircle className="w-6 h-6" style={{ color: '#E16B2A' }} />
                  )}
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#392F2D' }}>
                  Needs Attention
                </h3>
              </div>
              
              <div className="space-y-3">
                {availabilityConflicts.length > 0 && (
                  <Link to={createPageUrl("ScheduleBuilder")}>
                    <div className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02]" style={{ 
                      backgroundColor: '#EADED2',
                      border: '1px solid #E16B2A'
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5" style={{ color: '#E16B2A' }} />
                          <div>
                            <p className="font-bold" style={{ color: '#392F2D' }}>Scheduling Conflicts</p>
                            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                              {availabilityConflicts.length} shift{availabilityConflicts.length > 1 ? 's' : ''} need review
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full font-bold" style={{ 
                          backgroundColor: '#E16B2A', 
                          color: '#FFF2E2' 
                        }}>
                          {availabilityConflicts.length}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {pendingTimeOff > 0 && (
                  <Link to={`${createPageUrl("Employees")}?tab=timeoff`}>
                    <div className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02]" style={{ 
                      backgroundColor: '#EADED2',
                      border: '1px solid #E16B2A'
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5" style={{ color: '#E16B2A' }} />
                          <div>
                            <p className="font-bold" style={{ color: '#392F2D' }}>Time Off Requests</p>
                            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                              Pending approval
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full font-bold" style={{ 
                          backgroundColor: '#E16B2A', 
                          color: '#FFF2E2' 
                        }}>
                          {pendingTimeOff}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {unassignedShifts > 0 && (
                  <Link to={createPageUrl("ScheduleBuilder")}>
                    <div className="p-4 rounded-lg cursor-pointer transition-all hover:scale-[1.02]" style={{ 
                      backgroundColor: '#EADED2',
                      border: '1px solid #E16B2A'
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5" style={{ color: '#E16B2A' }} />
                          <div>
                            <p className="font-bold" style={{ color: '#392F2D' }}>Unassigned Shifts</p>
                            <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                              Need employee assignment
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full font-bold" style={{ 
                          backgroundColor: '#E16B2A', 
                          color: '#FFF2E2' 
                        }}>
                          {unassignedShifts}
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {availabilityConflicts.length === 0 && pendingTimeOff === 0 && unassignedShifts === 0 && (
                  <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#EADED2' }}>
                    <CheckCircle className="w-12 h-12 mx-auto mb-2" style={{ color: '#E16B2A' }} />
                    <p className="font-bold" style={{ color: '#392F2D' }}>All Clear!</p>
                    <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>No issues need attention</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Overview */}
          <Card style={{ 
            backgroundColor: '#FFF2E2', 
            borderRadius: '16px',
            border: '1px solid #392F2D',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(225, 107, 42, 0.2)' }}>
                  <Activity className="w-6 h-6" style={{ color: '#E16B2A' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#392F2D' }}>
                  Today's Overview
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold" style={{ color: '#392F2D' }}>Scheduled Shifts</p>
                    <div className="px-3 py-1 rounded-full font-bold" style={{ 
                      backgroundColor: '#E16B2A', 
                      color: '#FFF2E2' 
                    }}>
                      {todaysShifts.length}
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                    {[...new Set(todaysShifts.map(s => s.employee_id))].length} team members working
                  </p>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold" style={{ color: '#392F2D' }}>Tomorrow</p>
                    <div className="px-3 py-1 rounded-full font-bold" style={{ 
                      backgroundColor: '#392F2D', 
                      color: '#FFF2E2' 
                    }}>
                      {tomorrowsShifts.length}
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                    {[...new Set(tomorrowsShifts.map(s => s.employee_id))].length} team members scheduled
                  </p>
                </div>

                {!isWeatherLoading && weather.length > 0 && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                    <div className="flex items-center gap-3">
                      <CloudSun className="w-8 h-8" style={{ color: '#E16B2A' }} />
                      <div>
                        <p className="font-bold" style={{ color: '#392F2D' }}>Today's Weather</p>
                        <p className="text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                          {weather[0]?.high_temp}°F / {weather[0]?.low_temp}°F - {weather[0]?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights Section */}
        <Card style={{ 
          backgroundColor: '#FFF2E2', 
          borderRadius: '16px',
          border: '1px solid #392F2D',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(225, 107, 42, 0.2)' }}>
                  <BarChart3 className="w-6 h-6" style={{ color: '#E16B2A' }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: '#392F2D' }}>
                  Performance Insights
                </h3>
              </div>
              <Link to={createPageUrl("Analytics")}>
                <Button variant="ghost" className="flex items-center gap-2" style={{ color: '#E16B2A' }}>
                  View Analytics
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5" style={{ color: '#E16B2A' }} />
                  <p className="text-sm font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Labor %</p>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#392F2D' }}>
                  {stats.avgLaborPercentage}%
                </p>
                <div className="flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" style={{ color: '#E16B2A' }} />
                  <p className="text-xs font-medium" style={{ color: '#E16B2A' }}>On Target</p>
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5" style={{ color: '#E16B2A' }} />
                  <p className="text-sm font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Week Sales</p>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#392F2D' }}>
                  ${(stats.weekSalesTotal / 1000).toFixed(1)}k
                </p>
                <p className="text-xs font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Current Week</p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" style={{ color: '#E16B2A' }} />
                  <p className="text-sm font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Schedules</p>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#392F2D' }}>
                  {stats.publishedSchedules}
                </p>
                <p className="text-xs font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Published</p>
              </div>

              <div className="p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" style={{ color: '#E16B2A' }} />
                  <p className="text-sm font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Team</p>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: '#392F2D' }}>
                  {stats.activeEmployees}
                </p>
                <p className="text-xs font-medium" style={{ color: '#392F2D', opacity: 0.7 }}>Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to={createPageUrl("Employees")}>
            <Button className="w-full h-16 text-base font-bold transition-all hover:scale-105" style={{ 
              backgroundColor: '#FFF2E2', 
              color: '#392F2D',
              border: '1px solid #392F2D',
              borderRadius: '16px'
            }}>
              <Users className="w-5 h-5 mr-2" style={{ color: '#E16B2A' }} />
              Team
            </Button>
          </Link>

          <Link to={createPageUrl("Analytics")}>
            <Button className="w-full h-16 text-base font-bold transition-all hover:scale-105" style={{ 
              backgroundColor: '#FFF2E2', 
              color: '#392F2D',
              border: '1px solid #392F2D',
              borderRadius: '16px'
            }}>
              <BarChart3 className="w-5 h-5 mr-2" style={{ color: '#E16B2A' }} />
              Analytics
            </Button>
          </Link>

          <Link to={createPageUrl("LaborAudit")}>
            <Button className="w-full h-16 text-base font-bold transition-all hover:scale-105" style={{ 
              backgroundColor: '#FFF2E2', 
              color: '#392F2D',
              border: '1px solid #392F2D',
              borderRadius: '16px'
            }}>
              <FileText className="w-5 h-5 mr-2" style={{ color: '#E16B2A' }} />
              Audit
            </Button>
          </Link>

          <Link to={createPageUrl("Performa")}>
            <Button className="w-full h-16 text-base font-bold transition-all hover:scale-105" style={{ 
              backgroundColor: '#FFF2E2', 
              color: '#392F2D',
              border: '1px solid #392F2D',
              borderRadius: '16px'
            }}>
              <Flame className="w-5 h-5 mr-2" style={{ color: '#E16B2A' }} />
              Performa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
