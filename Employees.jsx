
import React, { useState, useEffect, useCallback } from "react";
import { Employee } from "@/api/entities";
import { Position } from "@/api/entities";
import { Availability } from "@/api/entities";
import { TimeOffRequest } from "@/api/entities";
import { User } from "@/api/entities";
import { SalesProjection } from "@/api/entities";
import { WeeklySchedule } from "@/api/entities";
import { Shift } from "@/api/entities";
import { StoreSettings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Download, Users, Clock, Eye, BarChart, CalendarCheck2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeList from "../components/employees/EmployeeList";
import AvailabilityManager from "../components/employees/AvailabilityManager";
import TimeOffManager from "../components/employees/TimeOffManager";
import PositionManager from "../components/employees/PositionManager";
import WeeklyAvailabilityView from "../components/employees/WeeklyAvailabilityView";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [allData, setAllData] = useState(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const user = await User.me();
            setCurrentUser(user);
        } catch (e) {
            console.error("Failed to fetch current user:", e);
        }
    }
    fetchUser();
  }, []);

  const loadData = useCallback(async () => {
    if (!currentUser) return;
    const [
        employeesData, 
        positionsData,
        availabilityData,
        salesProjections,
        performaSchedules,
        storeSettings
    ] = await Promise.all([
      Employee.filter({ created_by: currentUser.email }),
      Position.filter({ is_active: true, created_by: currentUser.email }, "sort_order"),
      Availability.filter({ created_by: currentUser.email }),
      SalesProjection.filter({ created_by: currentUser.email }),
      WeeklySchedule.filter({ created_by: currentUser.email, schedule_type: 'performa', is_published: false }),
      StoreSettings.filter({ created_by: currentUser.email })
    ]);

    const performaShiftPromises = performaSchedules.map(s => Shift.filter({ schedule_id: s.id }));
    const allPerformaShiftsNested = await Promise.all(performaShiftPromises);
    const allPerformaShifts = allPerformaShiftsNested.flat();

    setEmployees(employeesData);
    setPositions(positionsData);
    setAvailability(availabilityData);
    setAllData({
        employees: employeesData,
        performaShifts: allPerformaShifts,
        availability: availabilityData,
        sales: salesProjections,
        settings: storeSettings[0]
    });
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    loadData();
    
    // Check for tab parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['employees', 'availability', 'team-availability', 'timeoff', 'positions'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [currentUser, loadData]);

  const handleSubmit = async (employeeData) => {
    if (!currentUser) return;
    const dataWithUser = { ...employeeData, created_by: currentUser.email };
    if (editingEmployee) {
      await Employee.update(editingEmployee.id, dataWithUser);
    } else {
      await Employee.create(dataWithUser);
    }
    setShowForm(false);
    setEditingEmployee(null);
    loadData();
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleDelete = async (employee) => {
    await Employee.update(employee.id, { is_active: false });
    loadData();
  };

  const exportCoverSheet = () => {
    const activeEmployees = employees.filter((emp) => emp.is_active);
    const csvContent = [
    ['Employee ID', 'Name', 'Phone', 'Email', 'Positions'].join(','),
    ...activeEmployees.map((emp) => [
    emp.employee_id,
    `${emp.first_name} ${emp.last_name}`,
    emp.phone,
    emp.email || '',
    (emp.positions || []).join(' | ')].
    map((field) => `"${field}"`).join(','))].
    join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'find_a_cover_sheet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
  { id: "employees", label: "Employees", icon: Users },
  { id: "availability", label: "Availability", icon: CalendarCheck2 },
  { id: "team-availability", label: "Team View", icon: Eye },
  { id: "timeoff", label: "Time Off", icon: Clock },
  { id: "positions", label: "Positions", icon: Users }];


  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#de6a2b' }}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: '#FFF2E2' }}>Employee Management</h1>
                        <p className="mt-1" style={{ color: '#FFF2E2', opacity: 0.8 }}>Manage your team, availability, and positions</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            variant="outline"
                            onClick={exportCoverSheet}
                            className="flex-1 md:flex-none border font-semibold"
                            style={{ 
                                borderColor: '#FFF2E2', 
                                backgroundColor: 'transparent',
                                color: '#FFF2E2'
                            }}>

                            <Download className="w-4 h-4 mr-2" />
                            Export Cover Sheet
                        </Button>
                        {activeTab === "employees" && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="flex-1 md:flex-none font-semibold"
              style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>

                                <Plus className="w-5 h-5 mr-2" />
                                Add Employee
                            </Button>
            )}
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 p-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--bg-module)',
            borderColor: 'var(--bg-divider)'
          }}>
                        {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 font-semibold ${
                  activeTab === tab.id 
                    ? '' 
                    : 'hover:bg-black/5'
                }`}
              style={activeTab === tab.id ? { 
                  backgroundColor: '#E16B2A', 
                  color: '#FFF2E2' 
                } : { 
                  color: '#392F2D' 
                }}
            >

                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </Button>
            ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === "employees" &&
          <>
                            {showForm &&
            <EmployeeForm
              employee={editingEmployee}
              positions={positions}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingEmployee(null);
              }} />

            }
                            <EmployeeList
              employees={employees}
              onEdit={handleEdit}
              onDelete={handleDelete} />

                        </>
          }

                    {activeTab === "availability" &&
          <AvailabilityManager
            employees={employees.filter((emp) => emp.is_active)}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={setSelectedEmployee}
            onDataChange={loadData} />
          }
          
          {activeTab === "team-availability" && allData &&
            <WeeklyAvailabilityView allData={allData} />
          }

                    {activeTab === "timeoff" &&
          <TimeOffManager
            employees={employees.filter((emp) => emp.is_active)} />

          }

                    {activeTab === "positions" &&
          <PositionManager
            positions={positions}
            onPositionsChange={loadData} />

          }
                </AnimatePresence>
            </div>
        </div>);

}
