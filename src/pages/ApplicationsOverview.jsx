import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanResult } from '@/api/entities';
import { ApplicationDetection } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Database,
  MessageSquare,
  Server,
  Search,
  GitBranch,
  Box,
  Filter,
  RefreshCw,
  FileBarChart,
  DownloadCloud
} from "lucide-react";
import ApplicationsList from '@/components/dashboard/ApplicationsList';

export default function ApplicationsOverview() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [systems, setSystems] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [compatibilityFilter, setCompatibilityFilter] = useState('all');
  
  const projectId = sessionStorage.getItem('currentProjectId');

  useEffect(() => {
    if (!projectId) return;
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load systems
      const scanResults = await ScanResult.filter({ project_id: projectId });
      setSystems(scanResults);
      
      // Load application detections
      if (scanResults.length > 0) {
        const scanIds = scanResults.map(s => s.id);
        let appDetections = [];
        
        // For demo purposes, create mock application data
        // In a real implementation, this would fetch from the ApplicationDetection entity
        for (const scan of scanResults) {
          const mockApps = generateMockApplications(scan.id, scan.hostname);
          appDetections = [...appDetections, ...mockApps];
        }
        
        setApplications(appDetections);
      }
    } catch (error) {
      console.error("Error loading applications data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to generate mock applications for demo
  const generateMockApplications = (scanId, hostname) => {
    const apps = [
      {
        scan_id: scanId,
        application_name: "PostgreSQL",
        category: "database",
        version: "14.5",
        detection_method: "package",
        graviton_compatibility_status: "compatible",
        compatibility_notes: "Fully compatible with AWS Graviton processors",
        listening_ports: [{ port: 5432, protocol: "tcp", address: "0.0.0.0" }]
      },
      {
        scan_id: scanId,
        application_name: "Redis",
        category: "database",
        version: "6.2.7",
        detection_method: "process",
        graviton_compatibility_status: "compatible",
        compatibility_notes: "Fully compatible with AWS Graviton processors",
        listening_ports: [{ port: 6379, protocol: "tcp", address: "127.0.0.1" }]
      },
      {
        scan_id: scanId,
        application_name: "Docker",
        category: "container_orchestration",
        version: "20.10.18",
        detection_method: "package",
        graviton_compatibility_status: "compatible",
        listening_ports: [{ port: 2375, protocol: "tcp", address: "127.0.0.1" }]
      }
    ];
    
    // Conditionally add some apps based on hostname to create variety
    if (hostname.includes("web") || Math.random() > 0.5) {
      apps.push({
        scan_id: scanId,
        application_name: "Elasticsearch",
        category: "search_engine",
        version: "7.16.2",
        detection_method: "process",
        graviton_compatibility_status: "partial",
        compatibility_notes: "Requires JVM tuning for optimal performance on Graviton",
        listening_ports: [
          { port: 9200, protocol: "tcp", address: "0.0.0.0" },
          { port: 9300, protocol: "tcp", address: "0.0.0.0" }
        ]
      });
    }
    
    if (hostname.includes("queue") || Math.random() > 0.7) {
      apps.push({
        scan_id: scanId,
        application_name: "RabbitMQ",
        category: "message_queue",
        version: "3.9.13",
        detection_method: "package",
        graviton_compatibility_status: "compatible",
        listening_ports: [
          { port: 5672, protocol: "tcp", address: "0.0.0.0" },
          { port: 15672, protocol: "tcp", address: "0.0.0.0" }
        ]
      });
    }
    
    if (hostname.includes("ci") || Math.random() > 0.8) {
      apps.push({
        scan_id: scanId,
        application_name: "Jenkins",
        category: "ci_cd",
        version: "2.346.3",
        detection_method: "process",
        graviton_compatibility_status: "partial",
        compatibility_notes: "Base system works but some plugins may have issues",
        listening_ports: [{ port: 8080, protocol: "tcp", address: "0.0.0.0" }]
      });
    }
    
    // Sometimes add MySQL
    if (Math.random() > 0.6) {
      apps.push({
        scan_id: scanId,
        application_name: "MySQL",
        category: "database",
        version: "8.0.30",
        detection_method: "package",
        graviton_compatibility_status: "compatible",
        listening_ports: [{ port: 3306, protocol: "tcp", address: "0.0.0.0" }]
      });
    }
    
    // Occasionally add Kafka
    if (Math.random() > 0.7) {
      apps.push({
        scan_id: scanId,
        application_name: "Apache Kafka",
        category: "message_queue",
        version: "3.2.0",
        detection_method: "process",
        graviton_compatibility_status: "compatible",
        compatibility_notes: "Requires tuned JVM settings for optimal Graviton performance",
        listening_ports: [{ port: 9092, protocol: "tcp", address: "0.0.0.0" }]
      });
    }
    
    // Add MongoDB to some systems
    if (Math.random() > 0.5) {
      apps.push({
        scan_id: scanId,
        application_name: "MongoDB",
        category: "database",
        version: "5.0.9",
        detection_method: "package",
        graviton_compatibility_status: "compatible",
        listening_ports: [{ port: 27017, protocol: "tcp", address: "0.0.0.0" }]
      });
    }
    
    // Rarely add Aerospike with compatibility issues
    if (Math.random() > 0.85) {
      apps.push({
        scan_id: scanId,
        application_name: "Aerospike",
        category: "database",
        version: "5.7.0.3",
        detection_method: "process",
        graviton_compatibility_status: "not_compatible",
        compatibility_notes: "Older versions not compatible with Graviton. Version 6.0+ required for ARM support.",
        listening_ports: [
          { port: 3000, protocol: "tcp", address: "0.0.0.0" },
          { port: 3001, protocol: "tcp", address: "0.0.0.0" },
          { port: 3002, protocol: "tcp", address: "0.0.0.0" }
        ]
      });
    }
    
    return apps;
  };

  const filterApplications = () => {
    if (!applications) return [];
    
    return applications.filter(app => {
      // Filter by system
      if (selectedSystem !== 'all') {
        if (app.scan_id !== selectedSystem) return false;
      }
      
      // Filter by category
      if (categoryFilter !== 'all') {
        if (app.category !== categoryFilter) return false;
      }
      
      // Filter by compatibility
      if (compatibilityFilter !== 'all') {
        if (app.graviton_compatibility_status !== compatibilityFilter) return false;
      }
      
      return true;
    });
  };
  
  const filteredApplications = filterApplications();
  
  // Get stats for visualization
  const getAppStatsByCategory = () => {
    const stats = {
      database: 0,
      message_queue: 0,
      search_engine: 0,
      container_orchestration: 0,
      ci_cd: 0,
      other: 0
    };
    
    filteredApplications.forEach(app => {
      if (stats[app.category] !== undefined) {
        stats[app.category]++;
      } else {
        stats.other++;
      }
    });
    
    return stats;
  };
  
  const getCompatibilityStats = () => {
    const stats = {
      compatible: 0,
      not_compatible: 0,
      partial: 0,
      unknown: 0
    };
    
    filteredApplications.forEach(app => {
      if (stats[app.graviton_compatibility_status] !== undefined) {
        stats[app.graviton_compatibility_status]++;
      } else {
        stats.unknown++;
      }
    });
    
    return stats;
  };
  
  const appStatsByCategory = getAppStatsByCategory();
  const compatibilityStats = getCompatibilityStats();

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-8">
          <h1 className="text-3xl font-bold mb-4">No Project Selected</h1>
          <p className="mb-8 text-gray-500">Please select a project first to view applications</p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/Projects")}>
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="icon"
          className="mr-4"
          onClick={() => navigate("/Dashboard")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Applications Overview</h1>
          <p className="text-gray-500">Detected applications and their Graviton compatibility</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[100px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  System Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Systems</SelectItem>
                    {systems.map(system => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.hostname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Category Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Application Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="database">Databases</SelectItem>
                    <SelectItem value="message_queue">Message Queues</SelectItem>
                    <SelectItem value="search_engine">Search Engines</SelectItem>
                    <SelectItem value="container_orchestration">Containers & Orchestration</SelectItem>
                    <SelectItem value="ci_cd">CI/CD Tools</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            
            {/* Compatibility Filter */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Graviton Compatibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={compatibilityFilter} onValueChange={setCompatibilityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select compatibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="compatible">Compatible</SelectItem>
                    <SelectItem value="partial">Partial Support</SelectItem>
                    <SelectItem value="not_compatible">Not Compatible</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
          
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Applications by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Applications by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(appStatsByCategory).map(([category, count]) => (
                    count > 0 && (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {category === 'database' && <Database className="h-4 w-4 text-blue-500" />}
                          {category === 'message_queue' && <MessageSquare className="h-4 w-4 text-green-500" />}
                          {category === 'search_engine' && <Search className="h-4 w-4 text-purple-500" />}
                          {category === 'container_orchestration' && <Box className="h-4 w-4 text-cyan-500" />}
                          {category === 'ci_cd' && <GitBranch className="h-4 w-4 text-amber-500" />}
                          {category === 'other' && <Server className="h-4 w-4 text-gray-500" />}
                          <span className="capitalize">{category.replace('_', ' ')}s</span>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Compatibility Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Graviton Compatibility Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {compatibilityStats.compatible > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Compatible</span>
                      </div>
                      <span className="font-semibold">{compatibilityStats.compatible}</span>
                    </div>
                  )}
                  
                  {compatibilityStats.partial > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-yellow-600">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Partial Support</span>
                      </div>
                      <span className="font-semibold">{compatibilityStats.partial}</span>
                    </div>
                  )}
                  
                  {compatibilityStats.not_compatible > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Not Compatible</span>
                      </div>
                      <span className="font-semibold">{compatibilityStats.not_compatible}</span>
                    </div>
                  )}
                  
                  {compatibilityStats.unknown > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                        <span>Unknown</span>
                      </div>
                      <span className="font-semibold">{compatibilityStats.unknown}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Applications List */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Detected Applications</CardTitle>
                <CardDescription>
                  {filteredApplications.length} applications across {
                    selectedSystem === 'all' 
                      ? `${systems.length} systems` 
                      : '1 system'
                  }
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadData} className="h-8">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="h-8">
                  <DownloadCloud className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredApplications.length === 0 ? (
                <div className="text-center py-10">
                  <Server className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    No applications match your current filter criteria. Try changing your filters or scan more systems.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedSystem('all');
                      setCategoryFilter('all');
                      setCompatibilityFilter('all');
                    }}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <ApplicationsList applications={filteredApplications} />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}