
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileUp, FileDigit, Upload, ArrowUpCircle, 
  Cpu, AlertCircle, CheckCircle2, Circle, Server,
  BarChart3, PlusCircle, Settings, Terminal, Trash2, MoreVertical
} from "lucide-react";
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DropdownMenu, DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ImportedScansList } from '@/components/dashboard/ImportedScansList';

export default function Dashboard() {
  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const projectId = sessionStorage.getItem('currentProjectId');
  const navigate = useNavigate();
  const [systemToDelete, setSystemToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const results = await ScanResult.filter({ project_id: projectId }, '-scan_date');
      setSystems(results);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Circle className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Circle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };
  
  const formatDistribution = (scan) => {
    if (!scan.os_info) return 'Unknown';
    const { name, distribution, version } = scan.os_info;
    return distribution 
      ? `${distribution} ${version || ''}`
      : `${name} ${version || ''}`;
  };

  const getPackageCount = (scan) => {
    return scan.package_managers?.reduce((total, pm) => 
      total + (pm.packages?.length || 0), 0
    ) || 0;
  };

  const handleSystemClick = (system) => {
    // Store the selected system ID in session storage
    sessionStorage.setItem('selectedSystemId', system.id);
    // Navigate to the Graviton Compatibility page with the scanId parameter
    navigate(createPageUrl(`GravitonCompatibility?scanId=${system.id}`));
  };

  const handleDeleteSystem = async () => {
    if (!systemToDelete) return;

    try {
      await ScanResult.delete(systemToDelete.id);
      // Clear from session storage if it's the selected system
      if (sessionStorage.getItem('selectedSystemId') === systemToDelete.id) {
        sessionStorage.removeItem('selectedSystemId');
      }
      // Reload the systems list
      loadData();
      setShowDeleteDialog(false);
      setSystemToDelete(null);
    } catch (error) {
      console.error("Error deleting system:", error);
    }
  };

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">Welcome to GVTools</h1>
          <p className="mb-8 text-gray-500">Please select or create a project to get started</p>
          <Link to={createPageUrl("Projects")}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Go to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Project overview and system analysis</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New System
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link to={createPageUrl("ScanConfiguration")}>
                <DropdownMenuItem className="cursor-pointer">
                  <Terminal className="w-4 h-4 mr-2" />
                  Remote System Scan
                </DropdownMenuItem>
              </Link>
              <Link to={createPageUrl("LocalScan")}>
                <DropdownMenuItem className="cursor-pointer">
                  <Server className="w-4 h-4 mr-2" />
                  Scan This System <span className="ml-2 text-xs text-muted-foreground">(preview)</span>
                </DropdownMenuItem>
              </Link>
              <Link to={createPageUrl("Import")}>
                <DropdownMenuItem className="cursor-pointer">
                  <FileDigit className="w-4 h-4 mr-2" />
                  Import Syft Output
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Systems Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Systems
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Server className="w-5 h-5 text-blue-500 mr-2" />
                  <span className="text-3xl font-bold">{systems.length}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Packages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileDigit className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-3xl font-bold">
                    {systems.reduce((total, system) => total + getPackageCount(system), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link to={createPageUrl("GravitonCompatibility")} className="flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Cpu className="w-4 h-4 mr-2" />
                            View Analysis
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Graviton compatibility analysis for all systems</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Link>
                  <Link to={createPageUrl("Import")} className="flex-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <FileUp className="w-4 h-4 mr-2" />
                            Import Data
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Import existing system analysis data</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Systems List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analyzed Systems</span>
                <Button variant="ghost" onClick={loadData} className="text-sm h-8 px-2">
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                All analyzed systems in your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systems.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Systems Found</h3>
                  <p className="text-gray-500 mb-4">
                    Start by analyzing a system or importing existing system data
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link to={createPageUrl("ScanConfiguration")}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline">
                              <Terminal className="w-4 h-4 mr-2" />
                              Remote System Scan
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Scan multiple remote systems for analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Link>
                    <Link to={createPageUrl("LocalScan")}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline">
                              <Server className="w-4 h-4 mr-2" />
                              Scan This System <span className="ml-1 text-xs text-muted-foreground">(preview)</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Analyze the current system (preview feature)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Link>
                    <Link to={createPageUrl("Import")}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline">
                              <FileDigit className="w-4 h-4 mr-2" />
                              Import Syft Output
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Import existing Syft scan outputs</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border dark:border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>System</TableHead>
                        <TableHead>OS / Distribution</TableHead>
                        <TableHead>Analysis Date</TableHead>
                        <TableHead>Packages</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systems.map((system) => (
                        <TableRow 
                          key={system.id} 
                          className="hover-highlight cursor-pointer"
                          onClick={() => handleSystemClick(system)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Server className="h-4 w-4 text-blue-500" />
                              {system.hostname}
                            </div>
                          </TableCell>
                          <TableCell>{formatDistribution(system)}</TableCell>
                          <TableCell>
                            {format(new Date(system.scan_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FileDigit className="h-3.5 w-3.5 text-gray-500" />
                              {getPackageCount(system)}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(system.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1"
                                  >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleSystemClick(system)}>
                                    <Cpu className="h-4 w-4 mr-2" />
                                    View Analysis
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => {
                                      setSystemToDelete(system);
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete System
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the system "{systemToDelete?.hostname}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSystemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSystem}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
