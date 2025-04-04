import React, { useState, useEffect } from 'react';
import { ScanResult } from '@/api/entities';
import { GravitonCompatibility } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Terminal, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ArrowUpDown,
  Download,
  HelpCircle,
  Filter
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

export default function SystemsOverview() {
  const [systems, setSystems] = useState([]);
  const [compatibilityData, setCompatibilityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('hostname');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [scanResults, compatData] = await Promise.all([
        ScanResult.list('-scan_date'),
        GravitonCompatibility.list()
      ]);
      setSystems(scanResults);
      setCompatibilityData(compatData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const getSystemCompatibility = (system) => {
    let components = [];
    let blockers = [];
    let warnings = [];
    let compatible = 0;
    let incompatible = 0;
    let unknown = 0;

    // Check OS compatibility
    if (system.os_info) {
      const osName = system.os_info.distribution || system.os_info.name;
      const osVersion = system.os_info.version;
      const osCompat = compatibilityData.find(
        data => data.package_name.toLowerCase() === osName.toLowerCase()
      );

      if (osCompat) {
        if (osCompat.version_pattern.includes('>=')) {
          const minVersion = osCompat.version_pattern.replace('>=', '');
          if (osVersion < minVersion) {
            blockers.push(`OS version ${osVersion} is not supported (min: ${minVersion})`);
            incompatible++;
          } else {
            compatible++;
          }
        }
      } else {
        warnings.push(`OS compatibility unknown: ${osName} ${osVersion}`);
        unknown++;
      }
    }

    // Check packages
    if (system.package_managers) {
      system.package_managers.forEach(pm => {
        if (pm.packages) {
          pm.packages.forEach(pkg => {
            const pkgCompat = compatibilityData.find(
              data => data.package_name.toLowerCase() === pkg.name.toLowerCase()
            );
            
            if (pkgCompat) {
              components.push({
                name: pkg.name,
                version: pkg.version,
                type: 'Package',
                status: checkCompatibility(pkg.version, pkgCompat.version_pattern),
                notes: pkgCompat.notes
              });

              if (pkgCompat.version_pattern.includes('>=')) {
                const minVersion = pkgCompat.version_pattern.replace('>=', '');
                if (pkg.version < minVersion) {
                  incompatible++;
                  if (pkgCompat.notes?.includes('critical') || pkgCompat.notes?.includes('required')) {
                    blockers.push(`${pkg.name} version ${pkg.version} not supported (min: ${minVersion})`);
                  }
                } else {
                  compatible++;
                }
              }
            } else {
              unknown++;
            }
          });
        }
      });
    }

    // Check programming environments
    if (system.programming_environments) {
      system.programming_environments.forEach(env => {
        const runtimeCompat = compatibilityData.find(
          data => data.package_name.toLowerCase() === env.runtime.name.toLowerCase()
        );

        if (runtimeCompat) {
          components.push({
            name: env.runtime.name,
            version: env.runtime.version,
            type: 'Runtime',
            status: checkCompatibility(env.runtime.version, runtimeCompat.version_pattern),
            notes: runtimeCompat.notes
          });

          if (runtimeCompat.version_pattern.includes('>=')) {
            const minVersion = runtimeCompat.version_pattern.replace('>=', '');
            if (env.runtime.version < minVersion) {
              incompatible++;
              blockers.push(`Runtime ${env.runtime.name} version ${env.runtime.version} not supported (min: ${minVersion})`);
            } else {
              compatible++;
            }
          }
        } else {
          unknown++;
        }
      });
    }

    const total = compatible + incompatible + unknown;
    const score = total > 0 ? Math.round((compatible / total) * 100) : 0;

    return {
      components,
      blockers,
      warnings,
      score,
      status: blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'warning' : 'ready',
      stats: { compatible, incompatible, unknown, total }
    };
  };

  const checkCompatibility = (version, pattern) => {
    if (!pattern) return 'unknown';
    if (pattern === 'all') return 'compatible';
    if (pattern === 'none') return 'not_compatible';
    if (pattern === 'partial') return 'partial';
    if (pattern.includes('>=')) {
      const minVersion = pattern.replace('>=', '');
      return version >= minVersion ? 'compatible' : 'not_compatible';
    }
    return pattern === version ? 'compatible' : 'not_compatible';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredAndSortedSystems = systems
    .map(system => ({
      ...system,
      compatibility: getSystemCompatibility(system)
    }))
    .filter(system => {
      const matchesSearch = system.hostname.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || system.compatibility.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'hostname':
          comparison = a.hostname.localeCompare(b.hostname);
          break;
        case 'score':
          comparison = a.compatibility.score - b.compatibility.score;
          break;
        case 'status':
          comparison = a.compatibility.status.localeCompare(b.compatibility.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSummaryStats = () => {
    const stats = {
      total: filteredAndSortedSystems.length,
      ready: 0,
      warning: 0,
      blocked: 0
    };

    filteredAndSortedSystems.forEach(system => {
      stats[system.compatibility.status]++;
    });

    return stats;
  };

  const summaryStats = getSummaryStats();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Systems Overview</h1>
          <p className="text-gray-500">Graviton compatibility status across all systems</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Terminal className="h-8 w-8 text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Total Systems</p>
                      <p className="text-2xl font-bold">{summaryStats.total}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Ready for Migration</p>
                      <p className="text-2xl font-bold">{summaryStats.ready}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Needs Review</p>
                      <p className="text-2xl font-bold">{summaryStats.warning}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Blocked</p>
                      <p className="text-2xl font-bold">{summaryStats.blocked}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <CardTitle>Systems Compatibility Status</CardTitle>
              <CardDescription>
                Detailed overview of Graviton compatibility for all scanned systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search systems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ready">Ready for Migration</SelectItem>
                      <SelectItem value="warning">Needs Review</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          className="flex items-center"
                          onClick={() => toggleSort('hostname')}
                        >
                          Hostname
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead>OS Info</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center"
                          onClick={() => toggleSort('score')}
                        >
                          Compatibility Score
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center"
                          onClick={() => toggleSort('status')}
                        >
                          Status
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead>Issues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedSystems.map((system) => (
                      <TableRow key={system.id}>
                        <TableCell className="font-medium">
                          {system.hostname}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {system.os_info.distribution} {system.os_info.version}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full max-w-[180px]">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{system.compatibility.score}%</span>
                              <span className="text-gray-500">
                                ({system.compatibility.stats.compatible}/{system.compatibility.stats.total})
                              </span>
                            </div>
                            <Progress value={system.compatibility.score} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(system.compatibility.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(system.compatibility.status)}
                              <span className="capitalize">
                                {system.compatibility.status === 'ready' ? 'Ready' :
                                 system.compatibility.status === 'warning' ? 'Review' :
                                 'Blocked'}
                              </span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {system.compatibility.blockers.map((blocker, index) => (
                              <div key={index} className="flex items-center text-sm text-red-600">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {blocker}
                              </div>
                            ))}
                            {system.compatibility.warnings.map((warning, index) => (
                              <div key={index} className="flex items-center text-sm text-yellow-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {warning}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}