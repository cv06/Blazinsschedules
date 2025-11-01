
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, X, Edit2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { formatTime } from '@/components/lib/utils';

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function SpecialEventsManager({ projections, onProjectionsChange, weekStartDate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    day_of_week: '',
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    expected_sales_increase_percent: 0,
    expected_sales_increase_amount: 0
  });

  // Get all events across all days for display
  const allEvents = DAYS_OF_WEEK.flatMap(day => {
    const dayProjection = projections.find(p => p.day_of_week === day);
    const events = dayProjection?.special_events || [];
    return events.map((event, index) => ({
      ...event,
      day_of_week: day,
      date: addDays(weekStartDate, DAYS_OF_WEEK.indexOf(day)),
      eventIndex: index
    }));
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const handleAddEvent = () => {
    if (!newEvent.day_of_week || !newEvent.name.trim() || !newEvent.start_time) return;
    
    const updatedProjections = [...projections];
    let dayProjection = updatedProjections.find(p => p.day_of_week === newEvent.day_of_week);
    
    if (!dayProjection) {
      dayProjection = {
        week_start_date: format(weekStartDate, "yyyy-MM-dd"),
        day_of_week: newEvent.day_of_week,
        lunch_sales: 0,
        midday_sales: 0,
        dinner_sales: 0,
        late_night_sales: 0,
        special_events: [],
        total_daily_sales: 0
      };
      updatedProjections.push(dayProjection);
    }

    if (!dayProjection.special_events) {
      dayProjection.special_events = [];
    }

    dayProjection.special_events.push({
      name: newEvent.name,
      description: newEvent.description || '',
      start_time: newEvent.start_time,
      end_time: newEvent.end_time || '',
      expected_sales_increase_percent: parseFloat(newEvent.expected_sales_increase_percent) || 0,
      expected_sales_increase_amount: parseFloat(newEvent.expected_sales_increase_amount) || 0
    });

    onProjectionsChange(updatedProjections);
    
    setNewEvent({ day_of_week: '', name: '', description: '', start_time: '', end_time: '', expected_sales_increase_percent: 0, expected_sales_increase_amount: 0 });
    setShowAddForm(false);
  };

  const handleEditEvent = (dayOfWeek, eventIndex) => {
    const dayProjection = projections.find(p => p.day_of_week === dayOfWeek);
    const event = dayProjection?.special_events?.[eventIndex];
    
    if (event) {
      setEditingEvent({ day_of_week: dayOfWeek, eventIndex });
      setNewEvent({
        day_of_week: dayOfWeek,
        name: event.name,
        description: event.description || '',
        start_time: event.start_time,
        end_time: event.end_time || '',
        expected_sales_increase_percent: event.expected_sales_increase_percent || 0,
        expected_sales_increase_amount: event.expected_sales_increase_amount || 0
      });
      setShowAddForm(true);
    }
  };

  const handleUpdateEvent = () => {
    if (!editingEvent || !newEvent.name.trim() || !newEvent.start_time) return;

    const updatedProjections = [...projections];
    const dayProjection = updatedProjections.find(p => p.day_of_week === editingEvent.day_of_week);
    
    if (dayProjection && dayProjection.special_events) {
      dayProjection.special_events[editingEvent.eventIndex] = {
        name: newEvent.name,
        description: newEvent.description || '',
        start_time: newEvent.start_time,
        end_time: newEvent.end_time || '',
        expected_sales_increase_percent: parseFloat(newEvent.expected_sales_increase_percent) || 0,
        expected_sales_increase_amount: parseFloat(newEvent.expected_sales_increase_amount) || 0
      };
      
      onProjectionsChange(updatedProjections);
    }

    setNewEvent({ day_of_week: '', name: '', description: '', start_time: '', end_time: '', expected_sales_increase_percent: 0, expected_sales_increase_amount: 0 });
    setEditingEvent(null);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setNewEvent({ day_of_week: '', name: '', description: '', start_time: '', end_time: '', expected_sales_increase_percent: 0, expected_sales_increase_amount: 0 });
    setEditingEvent(null);
    setShowAddForm(false);
  };

  const handleRemoveEvent = (dayOfWeek, eventIndex) => {
    const updatedProjections = [...projections];
    const dayProjection = updatedProjections.find(p => p.day_of_week === dayOfWeek);
    
    if (dayProjection && dayProjection.special_events) {
      dayProjection.special_events.splice(eventIndex, 1);
      onProjectionsChange(updatedProjections);
    }
  };

  return (
    <Card className="border-2" style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D'}}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2" style={{color: '#392F2D'}}>
            <Calendar className="w-5 h-5" style={{color: '#E16B2A'}} />
            Special Events This Week
          </CardTitle>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingEvent(null);
              setNewEvent({ day_of_week: '', name: '', description: '', start_time: '', end_time: '', expected_sales_increase_percent: 0, expected_sales_increase_amount: 0 });
            }}
            style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 rounded-lg border-2 space-y-4" style={{backgroundColor: '#EADED2', borderColor: '#392F2D'}}>
            <h4 className="font-bold" style={{color: '#392F2D'}}>
              {editingEvent ? 'Edit Event' : 'New Event'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Day</label>
                <Select 
                  value={newEvent.day_of_week} 
                  onValueChange={(value) => setNewEvent(prev => ({ ...prev, day_of_week: value }))}
                  disabled={!!editingEvent}
                >
                  <SelectTrigger style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D'}}>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D'}}>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)} ({format(addDays(weekStartDate, index), 'MMM d')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Event Name</label>
                <Input
                  placeholder="e.g., Cowboys vs Giants"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                  style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Description (Optional)</label>
              <Textarea
                placeholder="Event details..."
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Start Time</label>
                <Input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                  style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>End Time (Optional)</label>
                <Input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                  style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Expected Sales Increase %</label>
                <Input
                  type="number"
                  placeholder="15"
                  value={newEvent.expected_sales_increase_percent}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, expected_sales_increase_percent: e.target.value }))}
                  style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block" style={{color: '#392F2D'}}>Expected Sales Increase $</label>
                <Input
                  type="number"
                  placeholder="200"
                  value={newEvent.expected_sales_increase_amount}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, expected_sales_increase_amount: e.target.value }))}
                  style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {editingEvent ? (
                <>
                  <Button onClick={handleUpdateEvent} style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
                    Update Event
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleAddEvent} style={{ backgroundColor: '#E16B2A', color: '#FFF2E2' }}>
                    Add Event
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} style={{backgroundColor: '#FFF2E2', borderColor: '#392F2D', color: '#392F2D'}}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {allEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{color: '#392F2D', opacity: 0.3}} />
            <p style={{color: '#392F2D', opacity: 0.7}}>No special events planned for this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allEvents.map((event, globalIndex) => (
              <div key={globalIndex} className="flex items-stretch gap-4 p-4 rounded-lg" style={{backgroundColor: '#EADED2'}}>
                {/* Date Box */}
                <div className="flex flex-col items-center justify-center px-8 py-4 rounded-lg" style={{backgroundColor: '#FFF2E2'}}>
                  <div className="text-sm font-semibold" style={{color: '#E16B2A'}}>
                    {format(event.date, 'EEEE')}
                  </div>
                  <div className="text-3xl font-bold" style={{color: '#392F2D'}}>
                    {format(event.date, 'MMM d').toUpperCase()}
                  </div>
                </div>

                {/* Expected Sales Increase */}
                <div className="flex flex-col justify-center px-8 py-4 rounded-lg" style={{backgroundColor: '#FFF2E2'}}>
                  <div className="text-sm font-semibold mb-2" style={{color: '#392F2D'}}>
                    Expected Sales Increase
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div className="text-3xl font-bold" style={{color: '#392F2D'}}>
                      {event.expected_sales_increase_percent || 0} %
                    </div>
                    <div className="text-2xl font-bold" style={{color: '#E16B2A'}}>
                      ${event.expected_sales_increase_amount || 0}
                    </div>
                  </div>
                </div>

                {/* Event Info with Times */}
                <div className="flex-1 flex items-center">
                  <div className="flex-1 flex flex-col">
                    {/* Times */}
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-base font-semibold" style={{color: '#392F2D'}}>
                        {formatTime(event.start_time)}
                      </div>
                      {event.end_time && (
                        <div className="text-base font-semibold" style={{color: '#392F2D'}}>
                          {formatTime(event.end_time)}
                        </div>
                      )}
                    </div>
                    
                    {/* Event Name and Description with Orange Bar */}
                    <div className="flex items-start gap-3">
                      <div className="w-1 h-12 rounded-full" style={{backgroundColor: '#E16B2A'}}></div>
                      <div className="flex-1">
                        <div className="font-bold text-lg" style={{color: '#392F2D'}}>{event.name}</div>
                        {event.description && (
                          <div className="text-sm mt-1" style={{color: '#392F2D', opacity: 0.7}}>{event.description}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditEvent(event.day_of_week, event.eventIndex)}
                    className="h-10 w-10 p-0 hover:bg-transparent"
                  >
                    <Edit2 className="w-5 h-5" style={{color: '#E16B2A'}} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveEvent(event.day_of_week, event.eventIndex)}
                    className="h-10 w-10 p-0 hover:bg-transparent"
                  >
                    <X className="w-5 h-5" style={{color: '#392F2D'}} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
