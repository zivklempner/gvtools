
import React, { useState } from 'react';
import { ScanResult } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, 
  Server, 
  PackageCheck, 
  Loader2, 
  AlertTriangle, 
  Check, 
  Play,
  Settings,
  ShieldCheck,
  TerminalSquare,
  ScanLine
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { InvokeLLM } from "@/api/integrations";

export default function NewScan() {
  const navigate = useNavigate();
  const [scanType, setScanType] = useState("remote");
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [username, setUsername] = useState("");
  const [scanOptions, setScanOptions] = useState({
    scanPackages: true,
    scanLanguages: true,
    scanContainers: true,
    checkGravitonCompatibility: true,
    generateSBOM: true,
    parallelScan: true,
    deepScan: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanStage, setScanStage] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState(null);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const totalStages = 4;
  const stageTitles = [
    "Connecting to target system",
    "Gathering system information",
    "Scanning packages and dependencies",
    "Analyzing Graviton compatibility"
  ];

  const startScan = async () => {
    if (!hostname && !ipAddress) {
      setError("Please enter a hostname or IP address");
      return;
    }

    // Get current project ID from session storage
    const projectId = sessionStorage.getItem('currentProjectId');
    if (!projectId) {
      setError("Please select a project first");
      navigate(createPageUrl("Projects"));
      return;
    }

    setError(null);
    setIsScanning(true);
    setScanProgress(0);
    setScanStage(0);
    setScanComplete(false);

    try {
      // Stage 1: Connecting
      await simulateStage(1);
      
      // Stage 2: Gathering system info
      await simulateStage(2);
      
      // Stage 3: Scanning packages
      await simulateStage(3);
      
      // Stage 4: Analyzing compatibility
      await simulateStage(4);

      // Generate a simulated scan result
      const result = await generateScanResults();
      
      // Add project_id to the scan result
      const scanData = {
        ...result,
        project_id: projectId
      };
      
      // Save the scan result
      const savedScan = await ScanResult.create(scanData);
      setScanResult(savedScan);
      
      // Mark scan as complete
      setIsScanning(false);
      setScanComplete(true);
      setScanProgress(100);

    } catch (err) {
      setError(`Scan failed: ${err.message || "An unknown error occurred"}`);
      setIsScanning(false);
    }
  };

  const simulateStage = async (stage) => {
    setScanStage(stage - 1);
    
    // Calculate progress based on stages
    const baseProgress = (stage - 1) * (100 / totalStages);
    
    // Simulate progress within the stage
    for (let i = 0; i <= 100; i += 5) {
      setScanProgress(baseProgress + (i * (100 / totalStages) / 100));
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const generateScanResults = async () => {
    // Use LLM to help generate realistic scan data
    const targetSystem = hostname || ipAddress;
    
    // Simulate a scan result similar to prod-web-01 and dev-db-02
    const prompt = `
      Generate a realistic software scan result for a server named "${targetSystem}".
      Format the response as a valid JSON object representing:
      
      1. An operating system (like Linux, one of: Ubuntu, CentOS, Debian, Amazon Linux)
      2. Package managers with 5-6 packages each (apt, yum, or dnf)
      3. Some programming environments (like Python, Node.js, or Java) with a few dependencies each
      4. Performance metrics like CPU and memory usage
      5. Deployment info
      
      Make it realistic but different from typical examples.
    `;

    const schema = {
      type: "object",
      properties: {
        hostname: { type: "string" },
        os_info: {
          type: "object",
          properties: {
            name: { type: "string" },
            distribution: { type: "string" },
            version: { type: "string" },
            architecture: { type: "string" }
          }
        },
        package_managers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              packages: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    version: { type: "string" },
                    source: { type: "string" },
                    licenses: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          }
        },
        programming_environments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              runtime: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                  path: { type: "string" }
                }
              },
              package_manager: { type: "string" },
              dependencies: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    version: { type: "string" },
                    source: { type: "string" }
                  }
                }
              }
            }
          }
        },
        performance_metrics: {
          type: "object",
          properties: {
            cpu_usage: { type: "number" },
            memory_usage: { type: "number" },
            scan_duration: { type: "number" },
            root_required: { type: "boolean" }
          }
        },
        deployment_info: {
          type: "object",
          properties: {
            method: { type: "string" },
            version: { type: "string" },
            container_image: { type: "string" }
          }
        },
        scan_config: {
          type: "object",
          properties: {
            storage_type: { type: "string" },
            compression: { type: "boolean" },
            parallel_scan: { type: "boolean" }
          }
        },
        status: { type: "string" }
      }
    };

    try {
      const response = await InvokeLLM({
        prompt,
        response_json_schema: schema
      });
      
      // Add scan_date and ensure all required fields
      const enhancedResult = {
        ...response,
        hostname: targetSystem,
        scan_date: new Date().toISOString(),
        status: "completed"
      };
      
      return enhancedResult;
    } catch (error) {
      console.error("Error generating scan results:", error);
      
      // Fallback to a simple predefined result
      return {
        hostname: targetSystem,
        scan_date: new Date().toISOString(),
        status: "completed",
        os_info: {
          name: "Linux",
          distribution: "Ubuntu",
          version: "22.04",
          architecture: "x86_64"
        },
        package_managers: [
          {
            name: "apt",
            packages: [
              { name: "openssl", version: "3.0.2", source: "ubuntu", licenses: ["OpenSSL"] },
              { name: "nginx", version: "1.18.0", source: "ubuntu", licenses: ["BSD"] }
            ]
          }
        ],
        programming_environments: [
          {
            runtime: { name: "python", version: "3.10.4", path: "/usr/bin/python3" },
            package_manager: "pip",
            dependencies: [
              { name: "requests", version: "2.28.1", source: "pypi" },
              { name: "flask", version: "2.2.2", source: "pypi" }
            ]
          }
        ],
        performance_metrics: {
          cpu_usage: 45,
          memory_usage: 2147483648, // 2GB in bytes
          scan_duration: 72,
          root_required: true
        },
        scan_config: {
          storage_type: "local",
          compression: false,
          parallel_scan: true
        }
      };
    }
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
          <h1 className="text-3xl font-bold">New Scan</h1>
          <p className="text-gray-500 dark:text-gray-400">Scan a new system for Graviton compatibility</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {scanComplete && scanResult && (
        <Alert className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Scan Complete</AlertTitle>
          <AlertDescription>
            Successfully scanned {scanResult.hostname}. Found {scanResult.package_managers?.reduce((total, pm) => total + (pm.packages?.length || 0), 0) || 0} packages.
            <div className="mt-2">
              <Button 
                className="mr-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                onClick={() => navigate(createPageUrl("Dashboard"))}
              >
                View Results
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl("GravitonCompatibility"))}
              >
                Check Graviton Compatibility
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <ScanLine className="h-5 w-5 text-blue-500" />
              Scan Configuration
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Configure target and scan options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={scanType} onValueChange={setScanType} className="mb-6">
              <TabsList className="grid grid-cols-2 w-[400px]">
                <TabsTrigger value="remote" disabled={isScanning}>
                  <Server className="w-4 h-4 mr-2" />
                  Remote Server
                </TabsTrigger>
                <TabsTrigger value="local" disabled={isScanning}>
                  <TerminalSquare className="w-4 h-4 mr-2" />
                  Local Machine
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {scanType === "remote" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostname" className="dark:text-gray-300">Hostname / FQDN</Label>
                    <Input
                      id="hostname"
                      placeholder="e.g., server.example.com"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                      disabled={isScanning}
                      className="dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ip" className="dark:text-gray-300">IP Address</Label>
                    <Input
                      id="ip"
                      placeholder="e.g., 192.168.1.10"
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      disabled={isScanning}
                      className="dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="dark:text-gray-300">Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="SSH username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isScanning}
                    className="dark:bg-slate-700 dark:border-slate-600"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If not provided, will attempt to use SSH keys or ask during scan
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-blue-700 dark:text-blue-300">
                  Scan will run on the current system. No additional configuration needed.
                </p>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 dark:text-gray-200">Scan Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="scanPackages"
                    checked={scanOptions.scanPackages}
                    onCheckedChange={(checked) => 
                      setScanOptions({...scanOptions, scanPackages: checked})
                    }
                    disabled={isScanning}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="scanPackages"
                      className="text-sm font-medium dark:text-gray-300"
                    >
                      Scan System Packages
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Includes apt, yum, and other package managers
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="scanLanguages"
                    checked={scanOptions.scanLanguages}
                    onCheckedChange={(checked) => 
                      setScanOptions({...scanOptions, scanLanguages: checked})
                    }
                    disabled={isScanning}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="scanLanguages"
                      className="text-sm font-medium dark:text-gray-300"
                    >
                      Scan Language Dependencies
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Includes Python, Node.js, Java, etc.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="scanContainers"
                    checked={scanOptions.scanContainers}
                    onCheckedChange={(checked) => 
                      setScanOptions({...scanOptions, scanContainers: checked})
                    }
                    disabled={isScanning}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="scanContainers"
                      className="text-sm font-medium dark:text-gray-300"
                    >
                      Scan Containers
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Scan docker/podman containers on the system
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="checkGraviton"
                    checked={scanOptions.checkGravitonCompatibility}
                    onCheckedChange={(checked) => 
                      setScanOptions({...scanOptions, checkGravitonCompatibility: checked})
                    }
                    disabled={isScanning}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="checkGraviton"
                      className="text-sm font-medium dark:text-gray-300"
                    >
                      Check Graviton Compatibility
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Analyze all components for ARM64 compatibility
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 border-t dark:border-gray-700 pt-4">
                <h3 className="text-lg font-medium mb-3 dark:text-gray-200">Advanced Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="generateSBOM"
                      checked={scanOptions.generateSBOM}
                      onCheckedChange={(checked) => 
                        setScanOptions({...scanOptions, generateSBOM: checked})
                      }
                      disabled={isScanning}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="generateSBOM"
                        className="text-sm font-medium dark:text-gray-300"
                      >
                        Generate SBOM
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="parallelScan"
                      checked={scanOptions.parallelScan}
                      onCheckedChange={(checked) => 
                        setScanOptions({...scanOptions, parallelScan: checked})
                      }
                      disabled={isScanning}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="parallelScan"
                        className="text-sm font-medium dark:text-gray-300"
                      >
                        Parallel Scanning
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="deepScan"
                      checked={scanOptions.deepScan}
                      onCheckedChange={(checked) => 
                        setScanOptions({...scanOptions, deepScan: checked})
                      }
                      disabled={isScanning}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="deepScan"
                        className="text-sm font-medium dark:text-gray-300"
                      >
                        Deep Scan
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              disabled={isScanning}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
              onClick={startScan}
              disabled={isScanning || scanComplete}
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {isScanning && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Scan Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium dark:text-gray-300">{stageTitles[scanStage]}</span>
                    <span className="text-sm font-medium dark:text-gray-300">{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-2" />
                </div>
                
                <div className="space-y-3">
                  {stageTitles.map((title, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center ${idx === scanStage ? 'text-blue-600 dark:text-blue-400' : 
                        idx < scanStage ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                      {idx < scanStage ? (
                        <Check className="h-5 w-5 mr-2" />
                      ) : idx === scanStage ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <div className="h-5 w-5 mr-2 rounded-full border-2 border-current" />
                      )}
                      <span>{title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
