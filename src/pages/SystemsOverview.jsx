
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Server,
  ArrowUpDown, SortAsc, SortDesc, Percent
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { detectApplications } from '../components/scanner/ApplicationDetector';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SystemsOverview() {
  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState("percentage-desc");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const projectId = "your_project_id"; // Replace with your actual project ID

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const results = await ScanResult.list('-scan_date');
      setSystems(results);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOsDistribution = () => {
    const distribution = {};
    systems.forEach(system => {
      const os = system.os_info?.distribution || system.os_info?.name || 'Unknown';
      distribution[os] = (distribution[os] || 0) + 1;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getLanguagesDistribution = () => {
    const languages = {};
    systems.forEach(system => {
      system.programming_environments?.forEach(env => {
        if (env.runtime?.name) {
          const langName = env.runtime.name.toLowerCase();
          const normalizedName = langName.charAt(0).toUpperCase() + langName.slice(1);
          languages[normalizedName] = (languages[normalizedName] || 0) + 1;
        } else {
          languages['Unknown'] = (languages['Unknown'] || 0) + 1;
        }
      });
    });
    
    return Object.entries(languages).map(([name, value]) => ({
      name,
      value
    }));
  };

  const calculateSystemScore = (system) => {
    let totalPackages = 0;
    let gravitonCompatible = 0;

    system.package_managers?.forEach(pm => {
      if (pm.packages) {
        totalPackages += pm.packages.length;
        gravitonCompatible += pm.packages.filter(pkg => {
          return !pkg.name.includes('x86') && !pkg.name.includes('i386');
        }).length;
      }
    });

    system.programming_environments?.forEach(env => {
      if (env.dependencies) {
        totalPackages += env.dependencies.length;
        gravitonCompatible += env.dependencies.filter(dep => {
          return !dep.name.includes('x86') && !dep.name.includes('i386');
        }).length;
      }
    });

    return totalPackages > 0 ? (gravitonCompatible / totalPackages) * 100 : 0;
  };

  const getTotalPages = () => Math.ceil(systems.length / itemsPerPage);

  const getSortedSystems = () => {
    const sortedSystems = [...systems];
    
    switch (sortOrder) {
      case "name-asc":
        return sortedSystems.sort((a, b) => 
          a.hostname.toLowerCase().localeCompare(b.hostname.toLowerCase())
        );
      case "name-desc":
        return sortedSystems.sort((a, b) => 
          b.hostname.toLowerCase().localeCompare(a.hostname.toLowerCase())
        );
      case "percentage-asc":
        return sortedSystems.sort((a, b) => 
          calculateSystemScore(a) - calculateSystemScore(b)
        );
      case "percentage-desc":
        return sortedSystems.sort((a, b) => 
          calculateSystemScore(b) - calculateSystemScore(a)
        );
      default:
        return sortedSystems;
    }
  };
  
  const paginatedSystems = getSortedSystems().slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getSortLabel = () => {
    switch (sortOrder) {
      case "name-asc":
        return "Name (A-Z)";
      case "name-desc":
        return "Name (Z-A)";
      case "percentage-asc":
        return "Score (Low to High)";
      case "percentage-desc":
        return "Score (High to Low)";
      default:
        return "Sort by";
    }
  };

  const scanSystem = async () => {
    setIsScanning(true);
    setScanError(null);
    let initialScanResult = null;
    
    try {
      // Create initial scan record
      initialScanResult = await ScanResult.create({
        project_id: projectId,
        hostname: window.location.hostname,
        scan_date: new Date().toISOString(),
        status: "in_progress"
      });

      // Detect applications
      const { detectedApplications, errors } = await detectApplications(initialScanResult.id);
      
      // Handle detection errors
      if (errors.length > 0) {
        console.error('Detection errors:', errors);
        // If we have detections but also errors, mark as partial
        const scanStatus = detectedApplications.length > 0 ? "partial" : "failed";
        await ScanResult.update(initialScanResult.id, {
          status: scanStatus,
          application_count: detectedApplications.length,
          error_details: errors.map(err => ({
            component: err.details.application || 'unknown',
            error: err.message,
            details: err.details
          }))
        });
        
        if (scanStatus === "failed") {
          setScanError("Failed to detect applications. Check console for details.");
          return;
        } else {
          setScanError("Some applications could not be fully analyzed. Check details for more information.");
        }
      } else {
        // Update scan status
        await ScanResult.update(initialScanResult.id, {
          status: "completed",
          application_count: detectedApplications.length
        });
      }

      loadData();
    } catch (error) {
      console.error("Error during scan:", error);
      setScanError(error.message || "An unexpected error occurred during the scan");
      
      // Try to update scan status if we have the initialScanResult
      try {
        if (initialScanResult?.id) {
          await ScanResult.update(initialScanResult.id, {
            status: "failed",
            error_details: [{
              component: "scan",
              error: error.message,
              details: error.stack
            }]
          });
        }
      } catch (updateError) {
        console.error("Error updating scan status:", updateError);
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">System analysis overview</p>
        </div>
        <Button onClick={scanSystem} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Scan System"}
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Systems Distribution</CardTitle>
              <CardDescription>Distribution of operating systems across analyzed systems</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getOsDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getOsDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Programming Languages Distribution</CardTitle>
              <CardDescription>Distribution of programming languages across systems</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getLanguagesDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getLanguagesDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Top Systems by Graviton Compatibility</CardTitle>
                <CardDescription>Systems ranked by their Graviton compatibility score</CardDescription>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    {getSortLabel()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("name-asc")}
                    className="cursor-pointer"
                  >
                    <SortAsc className="mr-2 h-4 w-4" />
                    Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("name-desc")}
                    className="cursor-pointer"
                  >
                    <SortDesc className="mr-2 h-4 w-4" />
                    Name (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("percentage-desc")}
                    className="cursor-pointer"
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Score (High to Low)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOrder("percentage-asc")}
                    className="cursor-pointer"
                  >
                    <Percent className="mr-2 h-4 w-4" />
                    Score (Low to High)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedSystems.map((system) => {
                const score = calculateSystemScore(system);
                return (
                  <div 
                    key={system.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Server className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{system.hostname}</h3>
                        <p className="text-sm text-gray-500">
                          {system.os_info?.distribution || system.os_info?.name} {system.os_info?.version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        className={
                          score >= 80 ? "bg-green-100 text-green-800" :
                          score >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }
                      >
                        {score.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {getTotalPages() > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {getTotalPages()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(getTotalPages(), p + 1))}
                  disabled={currentPage === getTotalPages()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(getTotalPages())}
                  disabled={currentPage === getTotalPages()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
