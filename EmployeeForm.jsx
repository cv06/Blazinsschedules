
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Save, X, Check, ChevronDown } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion } from "framer-motion";

const PositionSelector = ({ positions, selectedPositions, onPositionToggle }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="space-y-2">
            <Label className="blazin-text font-medium">Positions</Label>
            
            {/* Selected positions display */}
            <div className="flex flex-wrap gap-2 mb-3">
                {selectedPositions.map((position, index) => (
                    <Badge
                        key={`${position}-${index}`}
                        variant="secondary"
                        className="px-3 py-1 text-sm font-medium border cursor-pointer hover:opacity-80"
                        style={{
                            backgroundColor: '#E16B2A',
                            color: '#FFF2E2',
                            borderColor: '#E16B2A'
                        }}
                        onClick={() => onPositionToggle(position)}
                    >
                        {position}
                        <X className="w-3 h-3 ml-2" />
                    </Badge>
                ))}
            </div>

            {/* Position selection area */}
            <div className="relative">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full justify-between border rounded-lg h-12"
                    style={{
                        borderColor: '#392F2D',
                        backgroundColor: '#FFF2E2',
                        color: '#392F2D'
                    }}
                >
                    <span>
                        {selectedPositions.length === 0 
                            ? "Select positions..." 
                            : `${selectedPositions.length} position${selectedPositions.length !== 1 ? 's' : ''} selected`
                        }
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>

                {isOpen && (
                    <div 
                        className="absolute z-50 w-full mt-1 border rounded-lg shadow-lg"
                        style={{
                            backgroundColor: '#FFF2E2',
                            borderColor: '#392F2D',
                            maxHeight: '200px',
                            overflowY: 'auto'
                        }}
                    >
                        {positions.length === 0 ? (
                            <div className="p-3 text-sm" style={{ color: '#392F2D', opacity: 0.7 }}>
                                No positions available. Create some in the Positions tab.
                            </div>
                        ) : (
                            positions.map((position) => {
                                const isSelected = selectedPositions.includes(position.name);
                                return (
                                    <div
                                        key={position.id || position.name}
                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-black/5 transition-colors"
                                        onClick={() => onPositionToggle(position.name)}
                                    >
                                        <div 
                                            className={`w-4 h-4 border rounded flex items-center justify-center`}
                                            style={{
                                                borderColor: '#392F2D',
                                                backgroundColor: isSelected ? '#E16B2A' : 'transparent'
                                            }}
                                        >
                                            {isSelected && <Check className="w-3 h-3" style={{ color: '#FFF2E2' }} />}
                                        </div>
                                        <span className="font-medium" style={{ color: '#392F2D' }}>
                                            {position.name}
                                        </span>
                                        {position.description && (
                                            <span className="text-sm ml-auto" style={{ color: '#392F2D', opacity: 0.6 }}>
                                                {position.description}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function EmployeeForm({ employee, positions = [], onSubmit, onCancel }) {
    const [currentEmployee, setCurrentEmployee] = React.useState(() => {
        const defaultEmployee = {
            employee_id: "",
            first_name: "",
            last_name: "",
            phone: "",
            email: "",
            pay_type: "hourly",
            hourly_rate: "",
            positions: [],
            is_active: true,
            hire_date: "",
            notes: "",
        };
        
        if (!employee) {
            return defaultEmployee;
        }
        
        return {
            ...defaultEmployee,
            ...employee,
            positions: Array.isArray(employee.positions) ? [...employee.positions] : []
        };
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const employeeData = {
            ...currentEmployee,
            employee_id: currentEmployee.employee_id || `EMP${Date.now().toString().slice(-6)}`,
            hourly_rate: currentEmployee.pay_type === 'hourly' ? parseFloat(currentEmployee.hourly_rate || 0) : 0,
            positions: Array.isArray(currentEmployee.positions) ? currentEmployee.positions : []
        };
        onSubmit(employeeData);
    };

    const handleInputChange = (field, value) => {
        setCurrentEmployee(prev => ({ ...prev, [field]: value }));
    };

    const handlePositionToggle = (positionName) => {
        setCurrentEmployee(prev => {
            const currentPositions = Array.isArray(prev.positions) ? prev.positions : [];
            if (currentPositions.includes(positionName)) {
                return {
                    ...prev,
                    positions: currentPositions.filter(p => p !== positionName)
                };
            } else {
                return {
                    ...prev,
                    positions: [...currentPositions, positionName]
                };
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
        >
            <div className="border rounded-xl"
                 style={{
                   backgroundColor: '#EADED2',
                   borderColor: '#392F2D'
                 }}>
                <div className="border-b p-6"
                     style={{
                       backgroundColor: '#FFF2E2',
                       borderColor: '#392F2D'
                     }}>
                    <h2 className="flex items-center gap-2 blazin-text font-bold text-xl">
                        <User className="w-5 h-5" style={{ color: '#E16B2A' }} />
                        {employee ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="employee_id" className="blazin-text font-medium">Employee ID</Label>
                                <Input
                                    id="employee_id"
                                    placeholder="Auto-generated if empty"
                                    value={currentEmployee.employee_id || ""}
                                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                                    className="border"
                                    style={{
                                      borderColor: '#392F2D',
                                      backgroundColor: '#FFF2E2',
                                      color: '#392F2D'
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="blazin-text font-medium">First Name *</Label>
                                <Input
                                    id="first_name"
                                    placeholder="John"
                                    value={currentEmployee.first_name || ""}
                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                    className="border"
                                    style={{
                                      borderColor: '#392F2D',
                                      backgroundColor: '#FFF2E2',
                                      color: '#392F2D'
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="blazin-text font-medium">Last Name *</Label>
                                <Input
                                    id="last_name"
                                    placeholder="Doe"
                                    value={currentEmployee.last_name || ""}
                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                    className="border"
                                    style={{
                                      borderColor: '#392F2D',
                                      backgroundColor: '#FFF2E2',
                                      color: '#392F2D'
                                    }}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="blazin-text font-medium">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    placeholder="(555) 123-4567"
                                    value={currentEmployee.phone || ""}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="border"
                                    style={{
                                      borderColor: '#392F2D',
                                      backgroundColor: '#FFF2E2',
                                      color: '#392F2D'
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="blazin-text font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={currentEmployee.email || ""}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="border"
                                    style={{
                                      borderColor: '#392F2D',
                                      backgroundColor: '#FFF2E2',
                                      color: '#392F2D'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                             <div className="space-y-2">
                                <Label className="blazin-text font-medium">Pay Type</Label>
                                <ToggleGroup
                                    type="single"
                                    value={currentEmployee.pay_type}
                                    onValueChange={(value) => value && handleInputChange('pay_type', value)}
                                    className="w-full grid grid-cols-2"
                                >
                                    <ToggleGroupItem 
                                        value="hourly" 
                                        aria-label="Toggle hourly" 
                                        className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 border"
                                        style={{ borderColor: '#392F2D' }}
                                    >
                                        Hourly
                                    </ToggleGroupItem>
                                    <ToggleGroupItem 
                                        value="salary" 
                                        aria-label="Toggle salary" 
                                        className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 border"
                                        style={{ borderColor: '#392F2D' }}
                                    >
                                        Salary
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                            {currentEmployee.pay_type === 'hourly' && (
                                <div className="space-y-2">
                                    <Label htmlFor="hourly_rate" className="blazin-text font-medium">Hourly Rate *</Label>
                                    <Input
                                        id="hourly_rate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="15.00"
                                        value={currentEmployee.hourly_rate || ""}
                                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                                        className="border"
                                        style={{
                                          borderColor: '#392F2D',
                                          backgroundColor: '#FFF2E2',
                                          color: '#392F2D'
                                        }}
                                        required={currentEmployee.pay_type === 'hourly'}
                                    />
                                </div>
                            )}
                        </div>

                        <PositionSelector 
                            positions={positions}
                            selectedPositions={currentEmployee.positions || []}
                            onPositionToggle={handlePositionToggle}
                        />

                        <div className="space-y-2">
                            <Label htmlFor="hire_date" className="blazin-text font-medium">Hire Date</Label>
                            <Input
                                id="hire_date"
                                type="date"
                                value={currentEmployee.hire_date || ""}
                                onChange={(e) => handleInputChange('hire_date', e.target.value)}
                                className="border"
                                style={{
                                  borderColor: '#392F2D',
                                  backgroundColor: '#FFF2E2',
                                  color: '#392F2D'
                                }}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: '#392F2D' }}>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onCancel}
                                className="border"
                                style={{
                                  borderColor: '#392F2D',
                                  backgroundColor: '#FFF2E2',
                                  color: '#392F2D'
                                }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="font-semibold" 
                                style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {employee ? 'Update' : 'Add'} Employee
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}
