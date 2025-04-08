
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { ScanResult } from '@/api/entities';
import { GravitonCompatibility } from '@/api/entities';
import CompatibilityTable from '@/components/graviton/CompatibilityTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2, XCircle, AlertCircle, Info, 
  HelpCircle, Download, ArrowUpCircle, Server, 
  FileText, FileImage, FileSpreadsheet, Trash2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvokeLLM } from "@/api/integrations";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";

import CompatibilityBadge from '../components/graviton/CompatibilityBadge';

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

export default function GravitonCompatibilityPage() {
  const [scans, setScans] = useState([]);
  const [compatibilityData, setCompatibilityData] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState("");
  const [isLoadingExternalData, setIsLoadingExternalData] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [navigate, setNavigate] = useState(() => useNavigate());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Get scanId from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const scanId = urlParams.get('scanId') || sessionStorage.getItem('selectedSystemId');
      
      const [scanResults, compatData] = await Promise.all([
        ScanResult.list('-scan_date'),
        GravitonCompatibility.list()
      ]);
      
      setScans(scanResults);
      setCompatibilityData(compatData);
      
      // Try to find the scan with the provided ID
      if (scanId) {
        const scan = scanResults.find(s => s.id === scanId);
        if (scan) {
          setSelectedScan(scan);
          // Store the selected scan ID in case we need it later
          sessionStorage.setItem('selectedSystemId', scanId);
        } else if (scanResults.length > 0) {
          setSelectedScan(scanResults[0]);
        }
      } else if (scanResults.length > 0) {
        setSelectedScan(scanResults[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine all detectable components from the scan into a flat list
  const getAllComponents = () => {
    if (!selectedScan) return [];
    
    let components = [];
    
    // Add operating system
    if (selectedScan.os_info) {
      components.push({
        name: selectedScan.os_info.distribution || selectedScan.os_info.name,
        version: selectedScan.os_info.version,
        type: 'operating_system'
      });
    }
    
    // Add packages from package managers
    if (selectedScan.package_managers) {
      selectedScan.package_managers.forEach(pm => {
        if (pm.packages) {
          pm.packages.forEach(pkg => {
            components.push({
              name: pkg.name,
              version: pkg.version,
              type: 'software_package'
            });
          });
        }
      });
    }
    
    // Add programming environments
    if (selectedScan.programming_environments) {
      selectedScan.programming_environments.forEach(env => {
        // Add runtime
        components.push({
          name: env.runtime.name,
          version: env.runtime.version,
          type: 'programming_language'
        });
        
        // Add dependencies
        if (env.dependencies) {
          env.dependencies.forEach(dep => {
            components.push({
              name: dep.name,
              version: dep.version,
              type: 'software_package'
            });
          });
        }
      });
    }
    
    return components;
  };

  const fetchExternalCompatibility = async () => {
    setIsLoadingExternalData(true);
    try {
      const components = getAllComponents();
      
      const unknownComponents = components.filter(component => {
        const matchingData = compatibilityData.find(
          data => data.package_name.toLowerCase() === component.name.toLowerCase()
        );
        return !matchingData;
      });
      
      if (unknownComponents.length === 0) {
        alert("No unknown components to check");
        setIsLoadingExternalData(false);
        return;
      }
      
      const prompt = `
        I need information about AWS Graviton processor compatibility for these packages/components:
        ${unknownComponents.slice(0, 50).map(c => `${c.name} ${c.version} (${c.type})`).join('\n')}
        
        Use the AWS Graviton Getting Started GitHub repository as your primary reference source:
        https://github.com/aws/aws-graviton-getting-started
        
        This repository contains important compatibility information for many programming languages,
        operating systems, and software packages with AWS Graviton processors.
        
        Specifically check these documents in the repository:
        - README.md - for general compatibility guidelines
        - nodejs.md - for Node.js compatibility
        - python.md - for Python compatibility
        - containers.md - for container/Docker compatibility
        - golang.md - for Go compatibility
        - java.md - for Java compatibility
        - databases.md - for database compatibility
        - redis.md - for Redis compatibility
        - dotnet.md - for .NET compatibility
        - rust.md - for Rust compatibility
        
        For each package, provide:
        1. Whether it's compatible with AWS Graviton (ARM64)
        2. Any version requirements (e.g., >=1.2.0)
        3. Any notes about limitations or configuration needed
        
        Format your response as a JSON array with this structure:
        [
          {
            "package_name": "package-name",
            "version_pattern": "compatible version pattern or 'all' or 'none' or 'partial'",
            "component_type": "operating_system/software_package/programming_language/runtime_environment",
            "notes": "Any additional notes about compatibility",
            "source": "URL to specific documentation in the Graviton repo if available"
          },
          ...
        ]
        
        If you don't have information about a particular package, you can omit it from the results.
        For packages not explicitly mentioned in the repo, use your knowledge of ARM64 compatibility.
      `;
      
      const response = await InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            compatibility_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  package_name: { type: "string" },
                  version_pattern: { type: "string" },
                  component_type: { type: "string" },
                  notes: { type: "string" },
                  source: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      const newCompatibilityData = response.compatibility_data || [];
      console.log("Fetched external compatibility data:", newCompatibilityData);
      
      if (newCompatibilityData.length > 0) {
        for (const item of newCompatibilityData) {
          await GravitonCompatibility.create({
            ...item,
            source: item.source || "AWS Graviton Getting Started repository",
            last_verified: new Date().toISOString().split('T')[0]
          });
        }
        
        const updatedCompatData = await GravitonCompatibility.list();
        setCompatibilityData(updatedCompatData);
        
        alert(`Added compatibility information for ${newCompatibilityData.length} components`);
      } else {
        alert("No new compatibility information found");
      }
      
    } catch (error) {
      console.error("Error fetching external compatibility data:", error);
      alert(`Error fetching compatibility data: ${error.message}`);
    } finally {
      setIsLoadingExternalData(false);
    }
  };

  const getCompatibilitySummary = () => {
    const components = getAllComponents();
    if (components.length === 0) return { compatible: 0, notCompatible: 0, partial: 0, unknown: 0, total: 0 };
    
    let compatible = 0;
    let notCompatible = 0;
    let partial = 0;
    let unknown = 0;
    
    components.forEach(component => {
      const matchingData = compatibilityData.find(
        data => data.package_name.toLowerCase() === component.name.toLowerCase()
      );
      
      if (!matchingData) {
        unknown++;
        return;
      }
      
      if (matchingData.version_pattern.includes('>=')) {
        const minVersion = matchingData.version_pattern.replace('>=', '');
        component.version >= minVersion ? compatible++ : notCompatible++;
      } else if (matchingData.version_pattern.includes('all')) {
        compatible++;
      } else if (matchingData.version_pattern.includes('none')) {
        notCompatible++;
      } else if (matchingData.version_pattern.includes('partial')) {
        partial++;
      } else {
        matchingData.version_pattern === component.version ? compatible++ : notCompatible++;
      }
    });
    
    return {
      compatible,
      notCompatible,
      partial,
      unknown,
      total: components.length
    };
  };

  const filteredComponents = () => {
    const components = getAllComponents();
    if (activeTab === 'all') return components;
    
    return components.filter(component => {
      const matchingData = compatibilityData.find(
        data => data.package_name.toLowerCase() === component.name.toLowerCase()
      );
      
      if (!matchingData && activeTab === 'unknown') return true;
      if (!matchingData) return false;
      
      if (activeTab === 'compatible') {
        if (matchingData.version_pattern.includes('>=')) {
          const minVersion = matchingData.version_pattern.replace('>=', '');
          return component.version >= minVersion;
        } else if (matchingData.version_pattern.includes('all')) {
          return true;
        } else if (matchingData.version_pattern === component.version) {
          return true;
        }
        return false;
      }
      
      if (activeTab === 'not_compatible') {
        if (matchingData.version_pattern.includes('>=')) {
          const minVersion = matchingData.version_pattern.replace('>=', '');
          return component.version < minVersion;
        } else if (matchingData.version_pattern.includes('none')) {
          return true;
        } else if (matchingData.version_pattern !== component.version) {
          return true;
        }
        return false;
      }
      
      if (activeTab === 'partial') {
        return matchingData.version_pattern.includes('partial');
      }
      
      return false;
    });
  };

  // Create pie chart data
  const summary = getCompatibilitySummary();
  const pieChartData = [
    { name: 'Compatible', value: summary.compatible, color: '#22c55e' },
    { name: 'Not Compatible', value: summary.notCompatible, color: '#ef4444' },
    { name: 'Partial', value: summary.partial, color: '#f59e0b' },
    { name: 'Unknown', value: summary.unknown, color: '#6b7280' }
  ].filter(item => item.value > 0);

  const getComponentTypeStats = () => {
    const components = getAllComponents();
    const stats = new Map();

    components.forEach(comp => {
      const type = comp.type || 'unknown';
      if (!stats.has(type)) {
        stats.set(type, { total: 0, compatible: 0, notCompatible: 0, partial: 0, unknown: 0 });
      }

      const matchingData = compatibilityData.find(
        data => data.package_name.toLowerCase() === comp.name.toLowerCase()
      );
      
      const status = !matchingData ? 'unknown' :
        matchingData.version_pattern.includes('>=') ? 
          (comp.version >= matchingData.version_pattern.replace('>=', '') ? 'compatible' : 'notCompatible') :
        matchingData.version_pattern.includes('all') ? 'compatible' :
        matchingData.version_pattern.includes('none') ? 'notCompatible' :
        matchingData.version_pattern.includes('partial') ? 'partial' :
        (matchingData.version_pattern === comp.version ? 'compatible' : 'notCompatible');

      stats.get(type).total++;
      stats.get(type)[status]++;
    });

    return Array.from(stats.entries()).map(([type, data]) => ({
      name: type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1),
      Compatible: data.compatible,
      'Not Compatible': data.notCompatible,
      Partial: data.partial,
      Unknown: data.unknown
    }));
  };

  const barChartData = getComponentTypeStats();
  const compatibilityPercentage = summary.total > 0 
    ? Math.round((summary.compatible / summary.total) * 100) 
    : 0;

  const handleDeleteSystem = async () => {
    if (!selectedScan) return;

    try {
      await ScanResult.delete(selectedScan.id);
      // Clear from session storage
      if (sessionStorage.getItem('selectedSystemId') === selectedScan.id) {
        sessionStorage.removeItem('selectedSystemId');
      }
      // Navigate back to dashboard
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error deleting system:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Graviton Compatibility</h1>
          <p className="text-gray-500">Check AWS Graviton compatibility status of your components</p>
        </div>
        {!isLoading && selectedScan && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchExternalCompatibility}
              disabled={isLoadingExternalData}
            >
              {isLoadingExternalData ? (
                <>
                  <Skeleton className="h-4 w-4 rounded-full animate-spin mr-2" />
                  Checking Compatibility...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="mr-2 w-4 h-4" />
                  Check Unknown Components
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 w-4 h-4" />
              Delete System
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Layout: System selector on left, dashboard on right */}
          <div className="grid grid-cols-12 gap-6">
            {/* System Selector Panel */}
            <Card className="col-span-12 lg:col-span-3">
              <CardHeader>
                <CardTitle>Select System</CardTitle>
                <CardDescription>
                  Choose a system to analyze Graviton compatibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => setSelectedScan(scan)}
                      className={`p-3 cursor-pointer rounded-lg transition-all duration-150 ${
                        selectedScan?.id === scan.id
                          ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 selected-item"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 hover-highlight"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <p className="font-medium">{scan.hostname}</p>
                      </div>
                      {scan.os_info && (
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            {scan.os_info.distribution} {scan.os_info.version}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Dashboard Panel */}
            <div className="col-span-12 lg:col-span-9">
              {selectedScan ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Compatibility Overview</CardTitle>
                      <CardDescription>
                        AWS Graviton compatibility for {selectedScan.hostname}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center p-4 bg-green-50 rounded-lg">
                          <CheckCircle2 className="h-10 w-10 text-green-500 mr-4" />
                          <div>
                            <p className="text
-sm font-medium text-green-800">Compatible</p>
                            <p className="text-2xl font-bold text-green-900">{summary.compatible}</p>
                            <p className="text-sm text-green-700">{summary.total > 0 ? Math.round((summary.compatible / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-red-50 rounded-lg">
                          <XCircle className="h-10 w-10 text-red-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Not Compatible</p>
                            <p className="text-2xl font-bold text-red-900">{summary.notCompatible}</p>
                            <p className="text-sm text-red-700">{summary.total > 0 ? Math.round((summary.notCompatible / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-amber-50 rounded-lg">
                          <AlertCircle className="h-10 w-10 text-amber-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-amber-800">Partial Support</p>
                            <p className="text-2xl font-bold text-amber-900">{summary.partial}</p>
                            <p className="text-sm text-amber-700">{summary.total > 0 ? Math.round((summary.partial / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <HelpCircle className="h-10 w-10 text-gray-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">Unknown</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.unknown}</p>
                            <p className="text-sm text-gray-700">{summary.total > 0 ? Math.round((summary.unknown / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Overall Compatibility</span>
                          <span className="text-sm font-semibold text-gray-700">{compatibilityPercentage}%</span>
                        </div>
                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                            style={{ width: `${compatibilityPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Component Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({name, percent}) => 
                                percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                              }
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Bar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle>By Component Type</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barChartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Compatible" stackId="a" fill="#22c55e" />
                            <Bar dataKey="Not Compatible" stackId="a" fill="#ef4444" />
                            <Bar dataKey="Partial" stackId="a" fill="#f59e0b" />
                            <Bar dataKey="Unknown" stackId="a" fill="#6b7280" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Component compatibility table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Component Compatibility Details</CardTitle>
                      <CardDescription>
                        Compatibility status of detected components with AWS Graviton processors
                      </CardDescription>
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="compatible">Compatible</TabsTrigger>
                          <TabsTrigger value="not_compatible">Not Compatible</TabsTrigger>
                          <TabsTrigger value="partial">Partial</TabsTrigger>
                          <TabsTrigger value="unknown">Unknown</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                    <CardContent>
                      <CompatibilityTable 
                        items={filteredComponents()} 
                        compatibilityData={compatibilityData}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-40" />
                    <p className="text-lg">No system selected</p>
                    <p className="text-sm mt-2">Please select a system to analyze Graviton compatibility</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the system "{selectedScan?.hostname}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
