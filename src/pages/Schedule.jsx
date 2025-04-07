import React, { useState, useEffect } from 'react';
import { ScanSchedule } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { 
  Plus, Clock, Calendar, ArrowLeft, AlarmClock, Server, 
  Activity, Settings2, Filter, Trash2, Calendar as CalendarIcon, 
  Check, X, PlayCircle, PauseCircle, RefreshCcw
} from "lucide-react";
import { format } from 'date-fns';

export default function Schedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [scheduleType, setScheduleType] = useState("hostname");
  const [newSchedule, setNewSchedule] = useState({
    hostname: '',
    schedule_type: 'daily',
    time: '03:00',
    day: 'monday',
    config: {
      blacklist: [],
      whitelist: [],
      differential: true
    },
    status: 'active'
  });
  const [blacklistInput, setBlacklistInput] = useState('');
  const [whitelistInput, setWhitelistInput] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const results = await ScanSchedule.list('-created_date');
    setSchedules(results);
  };

  const handleCreateSchedule = async () => {
    try {
      // Get the current project ID
      const projectId = sessionStorage.getItem('currentProjectId');
      
      // Ensure hostname is set correctly based on the selected type
      let hostname = newSchedule.hostname;
      if (scheduleType === 'ip' && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
        // Mark IP addresses with a special prefix for identification
        hostname = 'ip:' + hostname;
      }
      
      // Calculate next run time
      const nextRun = calculateNextRun(newSchedule.schedule_type, newSchedule.time, newSchedule.day);
      
      // Create the schedule
      await ScanSchedule.create({
        ...newSchedule,
        hostname,
        project_id: projectId,
        next_run: nextRun.toISOString()
      });
      
      setShowNewSchedule(false);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const calculateNextRun = (schedule_type, timeStr, day) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    
    if (result <= now) {
      // If the time has already passed today, schedule for tomorrow or next occurrence
      switch (schedule_type) {
        case 'once':
          result.setDate(result.getDate() + 1);
          break;
        case 'daily':
          result.setDate(result.getDate() + 1);
          break;
        case 'weekly':
          // Calculate days until the next occurrence of the specified day
          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDayIndex = daysOfWeek.indexOf(day.toLowerCase());
          const currentDayIndex = now.getDay();
          let daysToAdd = targetDayIndex - currentDayIndex;
          if (daysToAdd <= 0) daysToAdd += 7;
          result.setDate(result.getDate() + daysToAdd);
          break;
        case 'monthly':
          // Schedule for next month, same day
          result.setMonth(result.getMonth() + 1);
          break;
      }
    } else if (schedule_type === 'weekly') {
      // If the time is still to come today, but we need to adjust for the correct day of the week
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDayIndex = daysOfWeek.indexOf(day.toLowerCase());
      const currentDayIndex = now.getDay();
      
      if (currentDayIndex !== targetDayIndex) {
        let daysToAdd = targetDayIndex - currentDayIndex;
        if (daysToAdd < 0) daysToAdd += 7;
        result.setDate(result.getDate() + daysToAdd);
      }
    }
    
    return result;
  };

  const resetForm = () => {
    setNewSchedule({
      hostname: '',
      schedule_type: 'daily',
      time: '03:00',
      day: 'monday',
      config: {
        blacklist: [],
        whitelist: [],
        differential: true
      },
      status: 'active'
    });
    setBlacklistInput('');
    setWhitelistInput('');
    setScheduleType('hostname');
  };

  const addBlacklist = () => {
    if (blacklistInput && !newSchedule.config.blacklist.includes(blacklistInput)) {
      setNewSchedule({
        ...newSchedule,
        config: {
          ...newSchedule.config,
          blacklist: [...newSchedule.config.blacklist, blacklistInput]
        }
      });
      setBlacklistInput('');
    }
  };

  const addWhitelist = () => {
    if (whitelistInput && !newSchedule.config.whitelist.includes(whitelistInput)) {
      setNewSchedule({
        ...newSchedule,
        config: {
          ...newSchedule.config,
          whitelist: [...newSchedule.config.whitelist, whitelistInput]
        }
      });
      setWhitelistInput('');
    }
  };

  const removeListItem = (list, item) => {
    setNewSchedule({
      ...newSchedule,
      config: {
        ...newSchedule.config,
        [list]: newSchedule.config[list].filter(i => i !== item)
      }
    });
  };

  const toggleScheduleStatus = async (schedule, newStatus) => {
    try {
      await ScanSchedule.update(schedule.id, { status: newStatus });
      loadSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await ScanSchedule.delete(scheduleId);
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Clock className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <PauseCircle className="w-3 h-3 mr-1" />
            Paused
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return null;
    }
  };

  const getScheduleTypeLabel = (type, day) => {
    switch (type) {
      case 'once':
        return 'One-time';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${day.charAt(0).toUpperCase() + day.slice(1)})`;
      case 'monthly':
        return `Monthly (Day ${day})`;
      default:
        return type;
    }
  };

  const formatNextRun = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    
    try {
      const date = new Date(dateStr);
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filter === 'all') return true;
    return schedule.status === filter;
  });

  const isIpAddress = (hostname) => {
    return hostname.startsWith('ip:');
  };

  const formatHostname = (hostname) => {
    if (isIpAddress(hostname)) {
      return hostname.substring(3); // Remove the 'ip:' prefix
    }
    return hostname;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => navigate(createPageUrl("Dashboard"))}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Scan Schedule</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage automated scanning schedules</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Label>Filter:</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showNewSchedule} onOpenChange={setShowNewSchedule}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Create New Scan Schedule
              </DialogTitle>
              <DialogDescription>
                Create an automated scan schedule for your system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Tabs value={scheduleType} onValueChange={setScheduleType}>
                <TabsList className="mb-4 grid grid-cols-2">
                  <TabsTrigger value="hostname">
                    <Server className="w-4 h-4 mr-2" />
                    Hostname
                  </TabsTrigger>
                  <TabsTrigger value="ip">
                    <Activity className="w-4 h-4 mr-2" />
                    IP Address
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="hostname">
                  <div className="grid gap-2">
                    <Label htmlFor="hostname">Hostname / FQDN</Label>
                    <Input
                      id="hostname"
                      placeholder="e.g., server.example.com"
                      value={newSchedule.hostname}
                      onChange={(e) => setNewSchedule({ ...newSchedule, hostname: e.target.value })}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="ip">
                  <div className="grid gap-2">
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      placeholder="e.g., 192.168.1.10"
                      value={newSchedule.hostname}
                      onChange={(e) => setNewSchedule({ ...newSchedule, hostname: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid gap-2">
                <Label htmlFor="scheduleType">Schedule Type</Label>
                <Select 
                  value={newSchedule.schedule_type} 
                  onValueChange={(value) => setNewSchedule({ ...newSchedule, schedule_type: value })}
                >
                  <SelectTrigger id="scheduleType">
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="time">Time (24-hour format)</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                />
              </div>

              {newSchedule.schedule_type === 'weekly' && (
                <div className="grid gap-2">
                  <Label htmlFor="day">Day of Week</Label>
                  <Select 
                    value={newSchedule.day} 
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}
                  >
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newSchedule.schedule_type === 'monthly' && (
                <div className="grid gap-2">
                  <Label htmlFor="monthlyDay">Day of Month</Label>
                  <Select 
                    value={newSchedule.day} 
                    onValueChange={(value) => setNewSchedule({ ...newSchedule, day: value })}
                  >
                    <SelectTrigger id="monthlyDay">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="differential"
                  checked={newSchedule.config.differential}
                  onCheckedChange={(checked) => 
                    setNewSchedule({
                      ...newSchedule,
                      config: { ...newSchedule.config, differential: checked }
                    })
                  }
                />
                <Label htmlFor="differential">Only report changes since last scan</Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="blacklist">Exclude Packages or Directories</Label>
                <div className="flex gap-2">
                  <Input
                    id="blacklist"
                    placeholder="e.g., /tmp or package-name"
                    value={blacklistInput}
                    onChange={(e) => setBlacklistInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addBlacklist()}
                  />
                  <Button type="button" variant="outline" onClick={addBlacklist}>
                    Add
                  </Button>
                </div>
                {newSchedule.config.blacklist.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSchedule.config.blacklist.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeListItem('blacklist', item)}
                      >
                        {item} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="whitelist">Only Scan These Packages or Directories</Label>
                <div className="flex gap-2">
                  <Input
                    id="whitelist"
                    placeholder="e.g., /usr or package-name"
                    value={whitelistInput}
                    onChange={(e) => setWhitelistInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addWhitelist()}
                  />
                  <Button type="button" variant="outline" onClick={addWhitelist}>
                    Add
                  </Button>
                </div>
                {newSchedule.config.whitelist.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newSchedule.config.whitelist.map((item, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeListItem('whitelist', item)}
                      >
                        {item} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewSchedule(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSchedule}
                disabled={!newSchedule.hostname}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Schedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Schedules</CardTitle>
          <CardDescription>
            All configured scan schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    No schedules found. Click "New Schedule" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isIpAddress(schedule.hostname) ? (
                          <Activity className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Server className="h-4 w-4 text-blue-500" />
                        )}
                        {formatHostname(schedule.hostname)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlarmClock className="h-4 w-4 text-gray-500" />
                        {getScheduleTypeLabel(schedule.schedule_type, schedule.day)}, {schedule.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        {formatNextRun(schedule.next_run)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.last_run ? formatNextRun(schedule.last_run) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(schedule.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {schedule.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleScheduleStatus(schedule, 'paused')}
                            title="Pause schedule"
                          >
                            <PauseCircle className="h-4 w-4 text-amber-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleScheduleStatus(schedule, 'active')}
                            title="Activate schedule"
                          >
                            <PlayCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Run now"
                        >
                          <RefreshCcw className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule(schedule.id)}
                          title="Delete schedule"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}