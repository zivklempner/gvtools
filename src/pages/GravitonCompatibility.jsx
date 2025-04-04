import React, { useState, useEffect } from 'react';
import { ScanResult } from '@/api/entities';
import { GravitonCompatibility } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, XCircle, AlertCircle, Info, 
  HelpCircle, Download, ArrowUpCircle, Server
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import CompatibilityTable from '../components/graviton/CompatibilityTable';

export default function GravitonCompatibilityPage() {
  const [scans, setScans] = useState([]);
  const [compatibilityData, setCompatibilityData] = useState([]);
  const [selectedScan, setSelectedScan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [scanResults, compatData] = await Promise.all([
          ScanResult.list('-scan_date'),
          GravitonCompatibility.list()
        ]);
        
        setScans(scanResults);
        setCompatibilityData(compatData);
        
        if (scanResults.length > 0) {
          setSelectedScan(scanResults[0]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Combine all detectable components from the scan into a flat list for compatibility checking
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

  const getComponentStatus = (component) => {
    const matchingData = compatibilityData.find(
      data => data.package_name.toLowerCase() === component.name.toLowerCase()
    );

    if (!matchingData) {
      return 'unknown';
    }

    if (matchingData.version_pattern.includes('>=')) {
      const minVersion = matchingData.version_pattern.replace('>=', '');
      return component.version >= minVersion ? 'compatible' : 'notCompatible';
    } else if (matchingData.version_pattern.includes('all')) {
      return 'compatible';
    } else if (matchingData.version_pattern.includes('none')) {
      return 'notCompatible';
    } else if (matchingData.version_pattern.includes('partial')) {
      return 'partial';
    } else {
      return matchingData.version_pattern === component.version ? 'compatible' : 'notCompatible';
    }
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

  const summary = getCompatibilitySummary();

  // Prepare chart data
  const pieChartData = [
    { name: 'Compatible', value: summary.compatible, color: '#22c55e' },
    { name: 'Not Compatible', value: summary.notCompatible, color: '#ef4444' },
    { name: 'Partial', value: summary.partial, color: '#f59e0b' },
    { name: 'Unknown', value: summary.unknown, color: '#6b7280' }
  ];

  const getComponentTypeStats = () => {
    const components = getAllComponents();
    const stats = new Map();

    components.forEach(comp => {
      const type = comp.type || 'unknown';
      if (!stats.has(type)) {
        stats.set(type, { total: 0, compatible: 0, notCompatible: 0, partial: 0, unknown: 0 });
      }

      const status = getComponentStatus(comp);
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Graviton Compatibility</h1>
          <p className="text-gray-500 dark:text-gray-400">Check AWS Graviton compatibility status of your components</p>
        </div>
        {!isLoading && selectedScan && (
          <Button variant="outline" className="dark:bg-gray-800 dark:text-gray-200">
            <Download className="mr-2 w-4 h-4" />
            Export Compatibility Report
          </Button>
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
                <CardTitle className="text-lg">Select System</CardTitle>
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
                      className={`p-3 cursor-pointer rounded-lg ${
                        selectedScan?.id === scan.id
                          ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <p className="font-medium">{scan.hostname}</p>
                      </div>
                      <div className="flex items-center mt-1">
                        <Badge variant="outline" className="text-xs">
                          {scan.os_info.distribution} {scan.os_info.version}
                        </Badge>
                      </div>
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
                  <Card className="dark:bg-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle>Compatibility Overview</CardTitle>
                      <CardDescription>
                        AWS Graviton compatibility for {selectedScan.hostname}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="flex items-center p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                          <CheckCircle2 className="h-10 w-10 text-green-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">Compatible</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{summary.compatible}</p>
                            <p className="text-sm text-green-700 dark:text-green-200">{summary.total > 0 ? Math.round((summary.compatible / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
                          <XCircle className="h-10 w-10 text-red-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">Not Compatible</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{summary.notCompatible}</p>
                            <p className="text-sm text-red-700 dark:text-red-200">{summary.total > 0 ? Math.round((summary.notCompatible / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-amber-50 rounded-lg dark:bg-amber-900/20">
                          <AlertCircle className="h-10 w-10 text-amber-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Partial Support</p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{summary.partial}</p>
                            <p className="text-sm text-amber-700 dark:text-amber-200">{summary.total > 0 ? Math.round((summary.partial / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700/40">
                          <HelpCircle className="h-10 w-10 text-gray-500 mr-4" />
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-300">Unknown</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.unknown}</p>
                            <p className="text-sm text-gray-700 dark:text-gray-400">{summary.total > 0 ? Math.round((summary.unknown / summary.total) * 100) : 0}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium dark:text-gray-300">Overall Compatibility</span>
                          <span className="text-sm font-semibold dark:text-gray-300">{compatibilityPercentage}%</span>
                        </div>
                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                          <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500" style={{ width: `${compatibilityPercentage}%` }}></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="text-lg">Component Distribution</CardTitle>
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
                              label={({name, percent}) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} components`, null]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                    
                    <Card className="dark:bg-gray-800">
                      <CardHeader>
                        <CardTitle className="text-lg">By Component Type</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={barChartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 5,
                            }}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [value, name]}
                              labelFormatter={(label) => `Type: ${label}`}
                            />
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
                      <CardTitle className="text-lg">Component Compatibility Details</CardTitle>
                      <CardDescription>
                        Compatibility status of detected components with AWS Graviton processors
                      </CardDescription>
                      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-5 mb-2">
                          <TabsTrigger value="all">All</TabsTrigger>
                          <TabsTrigger value="compatible" className="text-green-600">Compatible</TabsTrigger>
                          <TabsTrigger value="not_compatible" className="text-red-600">Not Compatible</TabsTrigger>
                          <TabsTrigger value="partial" className="text-amber-600">Partial</TabsTrigger>
                          <TabsTrigger value="unknown" className="text-gray-600">Unknown</TabsTrigger>
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
                <Card className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
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
    </div>
  );
}