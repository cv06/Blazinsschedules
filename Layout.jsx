

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Calendar, Users, TrendingUp, FileText, Settings, Clock, BarChart3, Edit, CalendarX, LogOut, User as UserIcon, Archive, ChevronLeft, ChevronRight, ChevronDown, LayoutDashboard, Briefcase, Calculator, ClipboardList } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationSections = [
  {
    title: "Overview",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: createPageUrl("Dashboard"), icon: BarChart3 },
      { title: "Analytics", url: createPageUrl("Analytics"), icon: TrendingUp }
    ]
  },
  {
    title: "Team",
    icon: Briefcase,
    items: [
      { title: "Employees", url: createPageUrl("Employees"), icon: Users }
    ]
  },
  {
    title: "Planning",
    icon: Calculator,
    items: [
      { title: "Sales Projections", url: createPageUrl("SalesProjections"), icon: Calendar },
      { title: "Performa", url: createPageUrl("Performa"), icon: Calendar }
    ]
  },
  {
    title: "Scheduling",
    icon: ClipboardList,
    items: [
      { title: "Schedule Builder", url: createPageUrl("ScheduleBuilder"), icon: Clock },
      { title: "Published Schedules", url: createPageUrl("PublishedSchedules"), icon: FileText },
      { title: "Labor Audit", url: createPageUrl("LaborAudit"), icon: Edit }
    ]
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    "Overview": true,
    "Team": true,
    "Planning": true,
    "Scheduling": true,
    "QuickActions": true
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Auto-expand section if it contains the active page
  useEffect(() => {
    navigationSections.forEach(section => {
      const hasActivePage = section.items.some(item => item.url === location.pathname);
      if (hasActivePage && !expandedSections[section.title]) {
        setExpandedSections(prev => ({ ...prev, [section.title]: true }));
      }
    });
  }, [location.pathname]);

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setUser(null);
      // Reload the page to show login state
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#de6a2b' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-300 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: '#FFF2E2' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#de6a2b' }}>
        <div className="max-w-md w-full mx-4">
          <div className="p-8 rounded-lg border text-center" style={{ backgroundColor: '#FFF2E2', borderColor: '#392F2D' }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ccf52e7f19bd829f1b45f2/29ccbce10_blzzsch.png"
              alt="Blazin' Schedules"
              className="h-20 w-auto mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4" style={{ color: '#392F2D' }}>
              Welcome to Blazin' Schedules
            </h1>
            <p className="mb-8" style={{ color: '#392F2D', opacity: 0.8 }}>
              Restaurant scheduling made simple. Sign in to get started.
            </p>
            <button
              onClick={() => User.login()}
              className="w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors"
              style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
            >
              Sign In with Google
            </button>
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#EADED2' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#392F2D' }}>
                New Restaurant?
              </p>
              <p className="text-xs" style={{ color: '#392F2D', opacity: 0.8 }}>
                Contact your administrator to get access, or sign in if you already have an account.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full relative" style={{ backgroundColor: '#EADED2' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          :root {
            /* Blazin' Schedules 4-Color Palette */
            --bg-orange: #de6a2b;
            --bg-module: #FFF2E2;
            --bg-divider: #EADED2;
            --text-charcoal: #392F2D;
            --brand-orange: #E16B2A;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--text-charcoal);
            background-color: var(--bg-orange);
          }

          /* Remove ALL shadows and standardize text colors */
          *, *::before, *::after {
            box-shadow: none !important;
            text-shadow: none !important;
            border-color: var(--bg-divider) !important;
          }

          /* Standardize ALL text to only use the 3 approved colors */
          .text-over-orange {
            color: #FFF2E2 !important;
          }
          
          .text-orange, .text-brand {
            color: #E16B2A !important;
          }
          
          .text-charcoal, .text-dark {
            color: #392F2D !important;
          }

          /* Ensure all text follows the color system */
          h1, h2, h3, h4, h5, h6, p, span, div, button, input, select, textarea, label {
            color: #392F2D;
          }

          /* Override any utility classes */
          .blazin-text {
            color: #392F2D !important;
            font-weight: 600;
          }
          .blazin-text-light {
            color: #392F2D !important;
            opacity: 0.7;
            font-weight: 500;
          }

          /* Sidebar transition */
          .sidebar-wrapper {
            transition: transform 0.3s ease-in-out, width 0.3s ease-in-out;
          }

          /* Content shift transition */
          .content-wrapper {
            transition: margin-left 0.3s ease-in-out;
          }

          /* Toggle notch styles */
          .sidebar-toggle {
            transition: all 0.3s ease-in-out;
          }

          /* Collapsible section animations */
          .section-content {
            overflow: hidden;
            transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
          }

          .section-chevron {
            transition: transform 0.3s ease-in-out;
          }

          .section-chevron.expanded {
            transform: rotate(0deg);
          }

          .section-chevron.collapsed {
            transform: rotate(-90deg);
          }

          /* Remove shadows ONLY from nav items */
          .nav-item {
            box-shadow: none !important;
            text-shadow: none !important;
          }
        `}
      </style>

      {/* Sidebar */}
      <div 
        className="sidebar-wrapper fixed left-0 top-0 h-full z-40"
        style={{ 
          width: isSidebarOpen ? '280px' : '0px',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-280px)',
        }}
      >
        <div 
          className="h-full flex flex-col"
          style={{ 
            width: '280px',
            background: 'linear-gradient(to bottom, #FFF7EF 0%, #FDF3E9 100%)',
            borderRight: '1px solid var(--bg-divider)'
          }}
        >
          {/* Logo Header with Gradient Background */}
          <div 
            className="p-6 relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #E16B2A 0%, #de6a2b 50%, #d4a98a 100%)',
              borderBottom: '1px solid rgba(57, 47, 45, 0.1)'
            }}
          >
            <div className="flex flex-col items-center justify-center gap-4 relative z-10">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ccf52e7f19bd829f1b45f2/29ccbce10_blzzsch.png"
                alt="Blazin' Schedules"
                className="h-16 w-auto" />
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-2">
              <div className="text-xs font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#392F2D', letterSpacing: '0.06em' }}>
                Navigation
              </div>
              <div className="space-y-2">
                {navigationSections.map((section) => (
                  <div key={section.title}>
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 transition-all"
                      style={{ color: '#392F2D' }}
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className="w-4 h-4" style={{ color: '#E16B2A' }} />
                        <span className="font-semibold text-xs uppercase tracking-wide">{section.title}</span>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 section-chevron ${expandedSections[section.title] ? 'expanded' : 'collapsed'}`}
                        style={{ color: '#392F2D' }}
                      />
                    </button>

                    {/* Section Items */}
                    <div 
                      className="section-content"
                      style={{
                        maxHeight: expandedSections[section.title] ? '500px' : '0px',
                        opacity: expandedSections[section.title] ? 1 : 0
                      }}
                    >
                      <div className="space-y-1 mt-1 ml-2">
                        {section.items.map((item) => (
                          <Link
                            key={item.title}
                            to={item.url}
                            className="nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm"
                            style={location.pathname === item.url ? { 
                              backgroundColor: '#E16B2A',
                              color: '#FFF2E2',
                              borderLeft: '3px solid #de6a2b',
                              boxShadow: 'none'
                            } : {
                              backgroundColor: 'transparent',
                              color: '#392F2D',
                              borderLeft: '3px solid transparent',
                              boxShadow: 'none'
                            }}
                          >
                            <item.icon className="w-5 h-5" style={{ color: '#E16B2A' }} />
                            <span>{item.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions - Now Collapsible */}
            <div className="mt-8">
              <button
                onClick={() => toggleSection("QuickActions")}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 transition-all"
                style={{ color: '#392F2D' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ letterSpacing: '0.06em' }}>Quick Actions</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 section-chevron ${expandedSections["QuickActions"] ? 'expanded' : 'collapsed'}`}
                  style={{ color: '#392F2D' }}
                />
              </button>
              
              <div 
                className="section-content"
                style={{
                  maxHeight: expandedSections["QuickActions"] ? '500px' : '0px',
                  opacity: expandedSections["QuickActions"] ? 1 : 0
                }}
              >
                <div className="space-y-2 px-1 mt-2">
                  <Link to={createPageUrl("ScheduleBuilder")} className="block group">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:translate-y-[-2px]"
                         style={{ backgroundColor: '#E16B2A', borderLeft: '3px solid #de6a2b' }}>
                      <Calendar className="w-5 h-5" style={{ color: '#FFF2E2' }} />
                      <span className="font-semibold text-sm" style={{ color: '#FFF2E2' }}>New Schedule</span>
                    </div>
                  </Link>
                  <Link to={`${createPageUrl("Employees")}?tab=timeoff`} className="block group">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:translate-y-[-2px]"
                         style={{ backgroundColor: '#E16B2A', borderLeft: '3px solid #de6a2b' }}>
                      <CalendarX className="w-5 h-5" style={{ color: '#FFF2E2' }} />
                      <span className="font-semibold text-sm" style={{ color: '#FFF2E2' }}>Time Off Request</span>
                    </div>
                  </Link>
                  <Link to={createPageUrl("Saves")} className="block group">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:translate-y-[-2px]"
                         style={{ backgroundColor: '#EADED2', borderLeft: '3px solid #c9b9a9' }}>
                      <Archive className="w-5 h-5" style={{ color: '#392F2D' }} />
                      <span className="font-semibold text-sm" style={{ color: '#392F2D' }}>Manage Saves</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="mt-6 px-1">
              <Link to={createPageUrl("Settings")} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 rounded-xl transition-all font-semibold" style={{ color: '#392F2D' }}>
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(57, 47, 45, 0.1)' }}>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div 
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:translate-y-[-2px]"
                  style={{
                    backgroundColor: '#FFF2E2',
                    border: '1px solid #EADED2'
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm relative"
                       style={{
                         backgroundColor: '#E16B2A',
                         color: '#FFF2E2'
                       }}>
                    {getInitials(user.full_name)}
                    <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2" style={{ backgroundColor: '#E16B2A', borderColor: '#FFF2E2' }}></div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-sm truncate" style={{ color: '#392F2D' }}>{user.full_name}</p>
                    <p className="text-xs truncate font-semibold" style={{ color: '#E16B2A' }}>{user.role === 'admin' ? 'Administrator' : 'Manager'}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent style={{ backgroundColor: 'var(--bg-module)', borderColor: 'var(--bg-divider)' }}>
                <DropdownMenuItem className="flex items-center gap-2" style={{ color: '#392F2D', cursor: 'default' }}>
                  <UserIcon className="w-4 h-4" />
                  <span>{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator style={{backgroundColor: 'var(--bg-divider)'}} />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer hover:bg-black/5"
                  style={{ color: '#392F2D' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Orange Toggle Notch */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="sidebar-toggle fixed top-1/2 z-50"
        style={{
          left: isSidebarOpen ? '280px' : '0px',
          transform: 'translateY(-50%)',
          backgroundColor: '#E16B2A',
          border: 'none',
          borderRadius: isSidebarOpen ? '0 12px 12px 0' : '0 12px 12px 0',
          padding: '16px 8px',
          cursor: 'pointer',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
        }}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="w-5 h-5" style={{ color: '#FFF2E2' }} />
        ) : (
          <ChevronRight className="w-5 h-5" style={{ color: '#FFF2E2' }} />
        )}
      </button>

      {/* Main Content */}
      <div 
        className="content-wrapper flex-1 flex flex-col min-h-screen"
        style={{
          marginLeft: isSidebarOpen ? '280px' : '0px',
        }}
      >
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

