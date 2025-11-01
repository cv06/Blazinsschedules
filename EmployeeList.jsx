
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Phone, Mail, DollarSign, MoreVertical, Edit, Trash2, Calendar, FileClock } from "lucide-react";
import { format } from "date-fns";

export default function EmployeeList({ employees, onEdit, onDelete }) {
    const activeEmployees = employees.filter(emp => emp.is_active);

    if (activeEmployees.length === 0) {
        return (
            <Card className="p-12 text-center border-0" style={{backgroundColor: 'var(--bg-module)'}}>
                <User className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-charcoal)', opacity: 0.2 }} />
                <h3 className="text-lg font-semibold blazin-text mb-2">No employees found</h3>
                <p className="blazin-text opacity-75">Add your first employee to get started</p>
            </Card>
        );
    }

    return (
        <div 
            className="w-full"
            style={{
                columnCount: 'auto',
                columnWidth: '300px',
                columnGap: '24px',
                columnFill: 'balance'
            }}
        >
            <AnimatePresence>
                {activeEmployees.map((employee) => (
                    <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full inline-block"
                        style={{ 
                            breakInside: 'avoid',
                            marginBottom: '24px'
                        }}
                    >
                        <Card className="border-0 w-full" style={{backgroundColor: 'var(--bg-module)'}}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                             style={{ backgroundColor: 'var(--brand-orange)', color: 'var(--bg-module)' }}>
                                            {employee.first_name[0]}{employee.last_name[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold blazin-text">
                                                {employee.first_name} {employee.last_name}
                                            </h3>
                                            <p className="text-sm blazin-text opacity-75">
                                                ID: {employee.employee_id}
                                            </p>
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="blazin-text">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" style={{backgroundColor: 'var(--bg-module)'}}>
                                            <DropdownMenuItem onClick={() => onEdit(employee)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => onDelete(employee)}
                                                className="focus:bg-black/10"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Deactivate
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm blazin-text">
                                        <Phone className="w-4 h-4" />
                                        <span>{employee.phone}</span>
                                    </div>
                                    
                                    {employee.email && (
                                        <div className="flex items-center gap-2 text-sm blazin-text">
                                            <Mail className="w-4 h-4" />
                                            <span className="truncate">{employee.email}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-2 text-sm blazin-text">
                                        <FileClock className="w-4 h-4" />
                                        <span className="capitalize">{employee.pay_type}</span>
                                    </div>
                                    
                                    {employee.pay_type === 'hourly' && (
                                        <div className="flex items-center gap-2 text-sm blazin-text">
                                            <DollarSign className="w-4 h-4" />
                                            <span>${employee.hourly_rate}/hour</span>
                                        </div>
                                    )}

                                    {employee.hire_date && (
                                        <div className="flex items-center gap-2 text-sm blazin-text">
                                            <Calendar className="w-4 h-4" />
                                            <span>Hired {format(new Date(employee.hire_date), "MMM d, yyyy")}</span>
                                        </div>
                                    )}
                                </div>

                                {employee.positions && employee.positions.length > 0 && (
                                    <div className="mt-4 pt-3 border-t">
                                        <div className="flex flex-wrap gap-1">
                                            {employee.positions.map((position) => (
                                                <Badge 
                                                    key={position}
                                                    variant="secondary"
                                                    className="text-xs border"
                                                    style={{backgroundColor: 'var(--bg-divider)', color: 'var(--text-charcoal)'}}
                                                >
                                                    {position}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
