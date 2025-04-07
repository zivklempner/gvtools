
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { 
  Terminal, ArrowLeft, Upload, Server, AlertCircle, 
  FileUp, Info, Loader2, Key, Lock, Calendar as CalendarIcon,
  FileText, Check, Clock, Database, Eye, EyeOff, ShieldCheck, Workflow,
  UserCircle, Info as InfoCircle
} from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ScanConfiguration() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSystem, setCurrentSystem] = useState("");
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);
  const sshKeyFileRef = useRef(null);
  
  // Bulk input states
  const [targetSystems, setTargetSystems] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  
  // Single system connection states
  const [connectionType, setConnectionType] = useState("ssh");
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [authMethod, setAuthMethod] = useState("password");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sshKey, setSshKey] = useState("");
  const [sshKeyFile, setSshKeyFile] = useState(null);
  const [sshKeyFileName, setSshKeyFileName] = useState("");
  
  // Scan configuration
  const [packageManagers, setPackageManagers] = useState(true);
  const [programmingEnvs, setProgrammingEnvs] = useState(true);
  const [systemInfo, setSystemInfo] = useState(true);
  const [containerInfo, setContainerInfo] = useState(false);
  const [applicationDetection, setApplicationDetection] = useState(true);
  
  // Scheduling
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [scheduleTime, setScheduleTime] = useState("12:00");

  const [scanMode, setScanMode] = useState("single");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "text/csv") {
        setScanError("Please upload a CSV file");
        return;
      }
      setFile(file);
      setFileName(file.name);
      setScanError(null);
    }
  };

  const handleSshKeyFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSshKeyFile(file);
      setSshKeyFileName(file.name);
    }
  };

  const handleTestConnection = () => {
    // Simulate connection test
    setIsScanning(true);
    setScanProgress(20);
    setTimeout(() => {
      setIsScanning(false);
      setScanProgress(0);
      alert(`Successfully connected to ${hostname}`);
    }, 2000);
  };

  const parseTargets = () => {
    if (scanMode === "single") {
      return [hostname];
    }
    
    const targets = new Set();
    
    // Parse manually entered targets (hostnames or IPs)
    if (targetSystems.trim()) {
      targetSystems.split(/[\n,]/).forEach(system => {
        const trimmed = system.trim();
        if (trimmed) targets.add(trimmed);
      });
    }
    
    return Array.from(targets);
  };

  const processCsvFile = async () => {
    try {
      const { file_url } = await UploadFile({ file });
      
      const { status, output } = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            targets: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  hostname: { type: "string" },
                  ip_address: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (status === "error") {
        throw new Error("Failed to parse CSV file");
      }

      return output.targets.map(t => t.hostname || t.ip_address);
    } catch (error) {
      console.error("Error processing CSV:", error);
      throw new Error("Failed to process CSV file");
    }
  };
  
  const validateSingleSystemForm = () => {
    if (!hostname) {
      return "Hostname or IP address is required";
    }
    
    if (authMethod === "password" && !password) {
      return "Password is required";
    }
    
    if (authMethod === "ssh_key" && !sshKey && !sshKeyFile) {
      return "SSH key is required";
    }
    
    if (port && isNaN(parseInt(port))) {
      return "Port must be a number";
    }
    
    return null;
  };

  const startScan = async () => {
    try {
      // Validate form based on mode
      if (scanMode === "single") {
        const validationError = validateSingleSystemForm();
        if (validationError) {
          throw new Error(validationError);
        }
      } else if (scanMode === "bulk" && !targetSystems.trim() && !file) {
        throw new Error("Please enter target systems or upload a CSV file");
      }
      
      setIsScanning(true);
      setScanError(null);
      
      let targets = parseTargets();
      
      // If CSV file is provided in bulk mode, process it and add targets
      if (scanMode === "bulk" && file) {
        const csvTargets = await processCsvFile();
        targets = [...new Set([...targets, ...csvTargets])];
      }
      
      if (targets.length === 0) {
        throw new Error("No valid targets found. Please specify at least one system to scan.");
      }

      // For each target, simulate a scan
      for (let i = 0; i < targets.length; i++) {
        setCurrentSystem(targets[i]);
        setScanProgress((i / targets.length) * 100);
        
        // Simulate scanning steps for each target
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      setScanProgress(100);
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1000);
      
    } catch (error) {
      console.error("Scan error:", error);
      setScanError(error.message);
      setIsScanning(false);
    }
  };

  if (isScanning) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Scanning Systems</CardTitle>
            <CardDescription>
              Analyzing {currentSystem ? `${currentSystem}` : 'systems'} for Graviton compatibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current system: {currentSystem}</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>

            {scanError && (
              <Alert variant="destructive">
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
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
          onClick={() => navigate(createPageUrl("Dashboard"))}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Remote System Scan</h1>
          <p className="text-gray-500">Configure and run system analysis on remote targets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan Configuration</CardTitle>
          <CardDescription>
            Specify systems and connection details for Graviton compatibility analysis
          </CardDescription>
          <Tabs value={scanMode} onValueChange={setScanMode} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single System</TabsTrigger>
              <TabsTrigger value="bulk">Multiple Systems</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="mt-4 space-y-6">
              {/* Core Connection Inputs */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium">Core Connection Inputs</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hostname">
                      Hostname or IP Address <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="hostname" 
                      placeholder="e.g., server.example.com or 192.168.1.100"
                      value={hostname}
                      onChange={(e) => setHostname(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">Port (default: 22 for SSH)</Label>
                    <Input 
                      id="port" 
                      placeholder="22"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="connection-type">Connection Type / Protocol</Label>
                    <Select value={connectionType} onValueChange={setConnectionType}>
                      <SelectTrigger id="connection-type">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ssh">SSH</SelectItem>
                        <SelectItem value="ssh_tunnel" disabled>SSH Tunnel (Coming soon)</SelectItem>
                        <SelectItem value="winrm" disabled>WinRM (Coming soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Authentication Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-lg font-medium">Authentication</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="e.g., admin or root"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="auth-method">Authentication Method</Label>
                    <Select value={authMethod} onValueChange={setAuthMethod}>
                      <SelectTrigger id="auth-method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="password">Password</SelectItem>
                        <SelectItem value="ssh_key">SSH Private Key</SelectItem>
                        <SelectItem value="kerberos" disabled>Kerberos (Coming soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {authMethod === "password" && (
                    <div className="space-y-2 col-span-full">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {authMethod === "ssh_key" && (
                    <div className="space-y-4 col-span-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Upload SSH Key File</Label>
                          <div className="border border-dashed rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                <Key className="w-5 h-5 text-blue-400" />
                              </div>
                              <div>
                                {sshKeyFileName ? (
                                  <p className="font-medium">{sshKeyFileName}</p>
                                ) : (
                                  <p className="text-gray-500">Private key file (e.g., id_rsa)</p>
                                )}
                              </div>
                            </div>
                            <input
                              type="file"
                              ref={sshKeyFileRef}
                              className="hidden"
                              onChange={handleSshKeyFileChange}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (sshKeyFileName) {
                                  setSshKeyFile(null);
                                  setSshKeyFileName("");
                                } else {
                                  sshKeyFileRef.current?.click();
                                }
                              }}
                            >
                              {sshKeyFileName ? "Remove" : "Browse"}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 mb-2">
                            <Label htmlFor="passphrase">Key Passphrase (if needed)</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enter passphrase only if your private key is encrypted</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input 
                            id="passphrase" 
                            type="password"
                            placeholder="Leave empty if no passphrase"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="ssh-key">Or Paste SSH Private Key</Label>
                        <Textarea 
                          id="ssh-key" 
                          placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                          className="font-mono text-xs h-32"
                          value={sshKey}
                          onChange={(e) => setSshKey(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Scan Configuration */}
              <Accordion type="single" collapsible defaultValue="scan-config">
                <AccordionItem value="scan-config">
                  <AccordionTrigger className="flex items-center gap-2 py-2">
                    <Workflow className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-medium">Scan Configuration</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="package-managers" 
                              checked={packageManagers}
                              onCheckedChange={setPackageManagers}
                            />
                            <Label htmlFor="package-managers">Scan package managers (apt, yum, etc.)</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="programming-envs" 
                              checked={programmingEnvs}
                              onCheckedChange={setProgrammingEnvs}
                            />
                            <Label htmlFor="programming-envs">Scan programming environments (Python, Node.js, etc.)</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="application-detection" 
                              checked={applicationDetection}
                              onCheckedChange={setApplicationDetection}
                            />
                            <Label htmlFor="application-detection">Detect running applications (databases, message queues, etc.)</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="system-info" 
                              checked={systemInfo}
                              onCheckedChange={setSystemInfo}
                            />
                            <Label htmlFor="system-info">Collect system information</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="container-info" 
                              checked={containerInfo}
                              onCheckedChange={setContainerInfo}
                            />
                            <Label htmlFor="container-info">Scan container images (if available)</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Scheduling */}
                <AccordionItem value="scheduling">
                  <AccordionTrigger className="flex items-center gap-2 py-2">
                    <CalendarIcon className="h-5 w-5 text-purple-500" />
                    <span className="text-lg font-medium">Scheduling</span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="schedule-switch"
                          checked={scheduleForLater}
                          onCheckedChange={setScheduleForLater}
                        />
                        <Label htmlFor="schedule-switch">Schedule for later</Label>
                      </div>
                      
                      {scheduleForLater && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {scheduleDate ? format(scheduleDate, "PPP") : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={scheduleDate}
                                  onSelect={setScheduleDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input
                              id="time"
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            
            <TabsContent value="bulk" className="mt-4 space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <Label className="text-base font-medium">Target Systems</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 p-1">
                          <Info className="h-4 w-4 text-gray-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Enter hostnames or IP addresses, one per line or comma-separated</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  placeholder="Enter hostnames or IP addresses...
Example:
server1.example.com
192.168.1.100
test-server, dev-server"
                  value={targetSystems}
                  onChange={(e) => setTargetSystems(e.target.value)}
                  className="h-32"
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="border-t border-gray-200 flex-grow"></span>
                <span>OR</span>
                <span className="border-t border-gray-200 flex-grow"></span>
              </div>
              
              <div>
                <Label className="text-base font-medium mb-2 block">Upload CSV File</Label>
                <div className="border border-dashed rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                      <FileUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      {fileName ? (
                        <p className="font-medium">{fileName}</p>
                      ) : (
                        <p className="text-gray-500">CSV file with hostnames or IP addresses</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Must include columns for hostname or ip_address
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (fileName) {
                        setFile(null);
                        setFileName("");
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    {fileName ? "Remove" : "Browse"}
                  </Button>
                </div>
                
                <div className="mt-6">
                  <Alert className="bg-blue-50 border-blue-100">
                    <InfoCircle className="h-4 w-4 text-blue-500" />
                    <AlertDescription>
                      For bulk scanning, default authentication will be used. For systems requiring different credentials, please scan them individually.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {scanError && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{scanError}</AlertDescription>
            </Alert>
          )}
        </CardHeader>
        
        <CardFooter className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
            Cancel
          </Button>
          
          {scanMode === "single" && (
            <Button 
              variant="outline" 
              className="border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
              onClick={handleTestConnection}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          )}
          
          <Button 
            onClick={startScan} 
            className="bg-blue-600 hover:bg-blue-700 ml-auto"
            disabled={scanMode === "single" ? !hostname : (!targetSystems.trim() && !file)}
          >
            <Terminal className="w-4 h-4 mr-2" />
            {scheduleForLater ? "Schedule Scan" : "Start Scanning"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
