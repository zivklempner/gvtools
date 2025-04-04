
import React, { useState, useEffect } from 'react';
import { ScanResult } from '@/api/entities';
import { ImportedScan } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { 
  Upload, Package, Code2, Server, AlertCircle, 
  Download, Settings, Activity, Box, Database, FileUp, Trash2, AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import ImportedScansList from "../components/dashboard/ImportedScansList";

export default function Dashboard() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [imports, setImports] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [outputFormat, setOutputFormat] = useState("json");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingScan, setDeletingScan] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [scanResults, importedScans] = await Promise.all([
      ScanResult.list('-scan_date'),
      ImportedScan.list('-import_date')
    ]);
    setScans(scanResults);
    setImports(importedScans);
    if (scanResults.length > 0 && !selectedScan) {
      setSelectedScan(scanResults[0]);
    }
  };

  const handleViewImportedScan = (scanResultId) => {
    const scan = scans.find(s => s.id === scanResultId);
    if (scan) {
      setSelectedScan(scan);
    }
  };

  const handleDeleteScan = async () => {
    if (!deletingScan) return;
    
    try {
      setIsDeleting(true);
      
      // First delete any imported scan that references this scan result
      const relatedImport = imports.find(imp => imp.scan_result_id === deletingScan.id);
      if (relatedImport) {
        await ImportedScan.delete(relatedImport.id);
      }
      
      // Then delete the scan result itself
      await ScanResult.delete(deletingScan.id);
      
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      
      // Reload data
      await loadData();
      
      // If the deleted scan was the selected one, reset selection
      if (selectedScan && selectedScan.id === deletingScan.id) {
        setSelectedScan(scans.length > 0 ? scans[0] : null);
      }
      
      setDeletingScan(null);
    } catch (error) {
      console.error("Error deleting scan:", error);
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const startNewScan = () => {
    navigate(createPageUrl("Import"));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">GVTools</h1>
          <p className="text-gray-500 dark:text-gray-400">Advanced Software Bill of Materials Scanner</p>
        </div>
        <div className="flex gap-3">
          <Select value={outputFormat} onValueChange={setOutputFormat}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON Format</SelectItem>
              <SelectItem value="yaml">YAML Format</SelectItem>
              <SelectItem value="cyclonedx">CycloneDX</SelectItem>
              <SelectItem value="spdx">SPDX Format</SelectItem>
              <SelectItem value="csv">CSV Format</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Link to={createPageUrl("Import")}>
              <Button variant="outline">
                <FileUp className="mr-2 h-4 w-4" />
                Import Syft
              </Button>
            </Link>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={startNewScan}
            >
              <Upload className="mr-2 h-4 w-4" />
              New Scan
            </Button>
          </div>
        </div>
      </div>

      {/* Recently Imported Scans */}
      {imports.length > 0 && (
        <div className="mb-6">
          <ImportedScansList 
            imports={imports} 
            onViewScan={handleViewImportedScan} 
            onReloadData={loadData}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Scans List */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[700px]">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-4 cursor-pointer rounded-lg mb-2 ${
                    selectedScan?.id === scan.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-gray-500 mr-2" />
                      <div>
                        <p className="font-medium">{scan.hostname}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(scan.scan_date), "MMM d, yyyy HH:mm")}
                          </p>
                          <Badge className={getStatusColor(scan.status)}>
                            {scan.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingScan(scan);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {scan.performance_metrics && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        CPU: {scan.performance_metrics.cpu_usage}% | RAM: {formatSize(scan.performance_metrics.memory_usage)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scan Details */}
        <div className="lg:col-span-8">
          {selectedScan ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      {selectedScan.hostname}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {selectedScan.os_info.distribution} {selectedScan.os_info.version}
                      </Badge>
                      <Badge variant="outline">
                        {selectedScan.os_info.architecture}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export ({outputFormat.toUpperCase()})
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="system" className="w-full">
                  <TabsList className="grid grid-cols-5 gap-4">
                    <TabsTrigger value="system">
                      <Settings className="w-4 h-4 mr-2" />
                      System
                    </TabsTrigger>
                    <TabsTrigger value="packages">
                      <Package className="w-4 h-4 mr-2" />
                      Packages
                    </TabsTrigger>
                    <TabsTrigger value="languages">
                      <Code2 className="w-4 h-4 mr-2" />
                      Languages
                    </TabsTrigger>
                    <TabsTrigger value="deployment">
                      <Box className="w-4 h-4 mr-2" />
                      Deployment
                    </TabsTrigger>
                    <TabsTrigger value="storage">
                      <Database className="w-4 h-4 mr-2" />
                      Storage
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="system" className="mt-4">
                    <div className="grid gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <span>CPU Usage</span>
                                <span>{selectedScan.performance_metrics?.cpu_usage}%</span>
                              </div>
                              <Progress value={selectedScan.performance_metrics?.cpu_usage} />
                            </div>
                            <div>
                              <div className="flex justify-between mb-2">
                                <span>Memory Usage</span>
                                <span>{formatSize(selectedScan.performance_metrics?.memory_usage)}</span>
                              </div>
                              <Progress 
                                value={(selectedScan.performance_metrics?.memory_usage / 1048576) * 100} 
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="packages" className="mt-4">
                    <div className="space-y-6">
                      {selectedScan.package_managers?.map((pm, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="capitalize">{pm.name} Packages</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Package Name</TableHead>
                                  <TableHead>Version</TableHead>
                                  <TableHead>Source</TableHead>
                                  <TableHead>Licenses</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pm.packages.map((pkg, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{pkg.name}</TableCell>
                                    <TableCell>{pkg.version}</TableCell>
                                    <TableCell>{pkg.source}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        {pkg.licenses?.map((license, i) => (
                                          <Badge key={i} variant="secondary">
                                            {license}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="languages" className="mt-4">
                    <div className="space-y-6">
                      {selectedScan.programming_environments?.map((env, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle>
                              {env.runtime.name} {env.runtime.version}
                            </CardTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Package Manager: {env.package_manager}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Dependency</TableHead>
                                  <TableHead>Version</TableHead>
                                  <TableHead>Source</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {env.dependencies.map((dep, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{dep.name}</TableCell>
                                    <TableCell>{dep.version}</TableCell>
                                    <TableCell>{dep.source}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="deployment" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">Deployment Method</p>
                              <p className="mt-1 dark:text-gray-500">{selectedScan.deployment_info?.method}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">Version</p>
                              <p className="mt-1 dark:text-gray-500">{selectedScan.deployment_info?.version}</p>
                            </div>
                            {selectedScan.deployment_info?.container_image && (
                              <div className="col-span-2">
                                <p className="text-sm font-medium dark:text-gray-300">Container Image</p>
                                <p className="mt-1 font-mono text-sm dark:text-gray-500">
                                  {selectedScan.deployment_info.container_image}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="storage" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">Storage Type</p>
                              <p className="mt-1 dark:text-gray-500">{selectedScan.scan_config?.storage_type}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">Compression</p>
                              <Badge variant="outline">
                                {selectedScan.scan_config?.compression ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium dark:text-gray-300">Parallel Scanning</p>
                              <Badge variant="outline">
                                {selectedScan.scan_config?.parallel_scan ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              Select a scan to view details
            </Card>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Delete Scan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the scan for "{deletingScan?.hostname}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteScan}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
