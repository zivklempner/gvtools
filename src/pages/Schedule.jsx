import React, { useState, useEffect } from 'react';
import { ScanSchedule } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Clock, Calendar, Plus, Play, Pause, Trash2 } from "lucide-react";

export default function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    hostname: '',
    schedule_type: 'daily',
    time: '00:00',
    config: {
      blacklist: [],
      whitelist: [],
      differential: false
    }
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const data = await ScanSchedule.list('-created_date');
    setSchedules(data);
  };

  const handleCreate = async () => {
    await ScanSchedule.create(newSchedule);
    loadSchedules();
    setNewSchedule({
      hostname: '',
      schedule_type: 'daily',
      time: '00:00',
      config: {
        blacklist: [],
        whitelist: [],
        differential: false
      }
    });
  };

  const toggleStatus = async (schedule) => {
    const newStatus = schedule.status === 'active' ? 'paused' : 'active';
    await ScanSchedule.update(schedule.id, { status: newStatus });
    loadSchedules();
  };

  const deleteSchedule = async (id) => {
    await ScanSchedule.delete(id);
    loadSchedules();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Scan Schedules</h1>
          <p className="text-gray-500">Manage automated scanning schedules</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Hostname"
                value={newSchedule.hostname}
                onChange={(e) => setNewSchedule({...newSchedule, hostname: e.target.value})}
              />
              <Select
                value={newSchedule.schedule_type}
                onValueChange={(value) => setNewSchedule({...newSchedule, schedule_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="time"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
              />
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Schedules</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hostname</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.hostname}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="capitalize">{schedule.schedule_type}</span>
                        <span>{schedule.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {format(new Date(schedule.next_run), "PPP")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.last_run ? format(new Date(schedule.last_run), "PPP") : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          schedule.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : schedule.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStatus(schedule)}
                        >
                          {schedule.status === 'active' ? (
                            <Pause className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Play className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}