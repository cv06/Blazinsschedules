
import React, { useState } from "react";
import { Position } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Save, X, Trash2, Edit, GripVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PositionManager({ positions, onPositionsChange }) {
    const [showForm, setShowForm] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
    const [newPosition, setNewPosition] = useState({
        name: "",
        description: "",
        is_active: true
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingPosition) {
            await Position.update(editingPosition.id, newPosition);
            setEditingPosition(null);
        } else {
            const newSortOrder = positions.length; // Assign sort_order based on current length
            await Position.create({ ...newPosition, sort_order: newSortOrder });
        }
        setShowForm(false);
        setNewPosition({ name: "", description: "", is_active: true });
        onPositionsChange();
    };

    const handleEdit = (position) => {
        setEditingPosition(position);
        setNewPosition({
            name: position.name,
            description: position.description || "",
            is_active: position.is_active
        });
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPosition(null);
        setNewPosition({ name: "", description: "", is_active: true });
    };

    const deletePosition = async (positionId) => {
        if (window.confirm('Are you sure you want to deactivate this position?')) {
            await Position.update(positionId, { is_active: false });
            onPositionsChange();
        }
    };
    
    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const items = Array.from(positions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update sort order sequentially to avoid rate limiting
        for (let i = 0; i < items.length; i++) {
            const position = items[i];
            // Only update if the order has actually changed
            if (position.sort_order !== i) {
                await Position.update(position.id, { sort_order: i });
            }
        }

        onPositionsChange();
    };

    return (
        <Card className="border-0" style={{ backgroundColor: '#EADED2' }}>
            <CardHeader className="p-6" style={{ backgroundColor: '#FFF2E2', border: 'none' }}>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2" style={{ color: '#392F2D' }}>
                        <Briefcase className="w-5 h-5" style={{ color: '#E16B2A' }} />
                        Position Management
                    </CardTitle>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        className="font-semibold"
                        style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Position
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 rounded-lg"
                            style={{
                              backgroundColor: '#FFF2E2',
                            }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label style={{ color: '#392F2D' }}>Position Name *</Label>
                                        <Input
                                            value={newPosition.name}
                                            onChange={(e) => setNewPosition(prev => ({ ...prev, name: e.target.value }))}
                                            style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                            placeholder="e.g., Server, Cook, Manager"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label style={{ color: '#392F2D' }}>Description</Label>
                                        <Input
                                            value={newPosition.description}
                                            onChange={(e) => setNewPosition(prev => ({ ...prev, description: e.target.value }))}
                                            style={{ borderColor: '#392F2D', backgroundColor: '#EADED2', color: '#392F2D' }}
                                            placeholder="Brief description of role"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        style={{ 
                                          borderColor: '#392F2D', 
                                          backgroundColor: 'transparent',
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
                                        {editingPosition ? 'Update Position' : 'Add Position'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-3">
                    {positions.length === 0 ? (
                        <div className="text-center py-8">
                            <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: '#FFF2E2', opacity: 0.5 }} />
                            <p style={{ color: '#392F2D', opacity: 0.75 }}>No positions created yet</p>
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="positions">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                        {positions.map((position, index) => (
                                            <Draggable key={position.id} draggableId={position.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`flex items-center justify-between p-4 rounded-lg transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                        style={{ 
                                                            ...provided.draggableProps.style,
                                                            backgroundColor: '#FFF2E2'
                                                        }}>
                                                        <div className="flex items-center gap-3">
                                                            <div {...provided.dragHandleProps} className="cursor-grab">
                                                                <GripVertical className="w-5 h-5" style={{color: '#EADED2'}} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold" style={{ color: '#392F2D' }}>{position.name}</h3>
                                                                {position.description && (
                                                                    <p className="text-sm" style={{ color: '#392F2D', opacity: 0.75 }}>{position.description}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge 
                                                                variant="outline" 
                                                                className="border-0"
                                                                style={{ 
                                                                  backgroundColor: '#EADED2', 
                                                                  color: '#392F2D'
                                                                }}
                                                            >
                                                                Active
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(position)}
                                                                className="hover:bg-black/10"
                                                                style={{ color: '#E16B2A' }}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => deletePosition(position.id)}
                                                                className="hover:bg-black/10"
                                                                style={{ color: '#E16B2A' }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
