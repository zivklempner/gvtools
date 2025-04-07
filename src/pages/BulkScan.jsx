import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, FileUp, ServerCrash, Upload, CheckCircle, CheckCheck, 
  AlertCircle, X, Play, Loader2, PanelRight, Server, ExternalLink
} from "lucide-react";

export default function BulkScan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState("file");
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [manualList, setManualList] = useState("");
  const [hostsList, setHostsList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentHostIndex, setCurrentHostIndex] = useState(-1);
  const [errors, setErrors] = useState({});
  const [scanResults, setScanResults] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (selectedFile) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(10);

    try {
      // Upload file
      const { file_url } = await UploadFile({ file: selectedFile });
      setProgress(40);

      // Define schema for extracting hosts
      const schema = {
        type: "object",
        properties: {
          hosts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                hostname: { type: "string" },
                ip: { type: "string" }
              }
            }
          }
        }
      };

      // Extract data
      const { status, output } = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });

      setProgress(70);

      if (status === "success" && output && output.hosts) {
        processHostsList(output.hosts);
      } else {
        // Try to parse as simple list of hostnames/IPs
        const { file_url: rawFileUrl } = await UploadFile({ file: selectedFile });
        
        // Here we'd need to read the file content directly, but in this mock implementation
        // we'll simulate parsing a list of hostnames
        const mockHosts = [
          { hostname: "server1.example.com", ip: "" },
          { hostname: "server2.example.com", ip: "" },
          { hostname: "server3.example.com", ip: "" },
          { hostname: "", ip: "192.168.1.10" },
          { hostname: "", ip: "192.168.1.11" }
        ];
        
        processHostsList(mockHosts);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setErrors({ file: "Failed to process file: " + error.message });
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const processManualList = () => {
    const lines = manualList.split('\n').filter(line => line.trim());
    const hosts = lines.map(line => {
      line = line.trim();
      // Simple regex to check if the line is an IP address
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(line);
      
      return {
        hostname: isIP ? "" : line,
        ip: isIP ? line : ""
      };
    });
    
    processHostsList(hosts);
  };

  const processHostsList = (hosts) => {
    // Filter out invalid entries
    const validHosts = hosts.filter(host => 
      (host.hostname && host.hostname.trim()) || (host.ip && host.ip.trim())
    );
    
    setHostsList(validHosts.map(host => ({
      ...host,
      status: "pending"
    })));
  };

  const startScans = async () => {
    if (hostsList.length === 0) {
      setErrors({ general: "No hosts to scan" });
      return;
    }

    const projectId = sessionStorage.getItem('currentProjectId');
    if (!projectId) {
      setErrors({ general: "Please select a project first" });
      navigate(createPageUrl("Projects"));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Update local state to show progress
    const updatedList = [...hostsList];
    const results = { ...scanResults };

    for (let i = 0; i < updatedList.length; i++) {
      setCurrentHostIndex(i);
      const host = updatedList[i];
      
      // Update status to processing
      updatedList[i] = { ...host, status: "processing" };
      setHostsList(updatedList);
      
      try {
        // Simulate the scan process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate mock scan data
        const scanData = await generateScanData(host, projectId);
        
        // Save the scan
        const scanResult = await ScanResult.create(scanData);
        
        // Update status to completed
        updatedList[i] = { ...host, status: "completed" };
        results[host.hostname || host.ip] = scanResult.id;
      } catch (error) {
        console.error(`Error scanning ${host.hostname || host.ip}:`, error);
        updatedList[i] = { ...host, status: "failed", error: error.message };
      }
      
      setHostsList(updatedList);
      setScanResults(results);
    }
    
    setCurrentHostIndex(-1);
    setIsSubmitting(false);
  };

  const generateScanData = async (host, projectId) => {
    const hostname = host.hostname || host.ip;
    
    // Generate a simulated scan result
    return {
      project_id: projectId,
      hostname: hostname,
      scan_date: new Date().toISOString(),
      status: "completed",
      os_info: {
        name: "Linux",
        distribution: Math.random() > 0.5 ? "Ubuntu" : "CentOS",
        version: Math.random() > 0.5 ? "20.04" : "8.4",
        architecture: "x86_64"
      },
      package_managers: [
        {
          name: Math.random() > 0.5 ? "apt" : "yum",
          packages: [
            {
              name: "nginx",
              version: "1.18.0",
              source: "main",
              licenses: ["MIT"]
            },
            {
              name: "openssl",
              version: "1.1.1f",
              source: "main",
              licenses: ["OpenSSL"]
            }
          ]
        }
      ],
      programming_environments: [
        {
          runtime: {
            name: "python",
            version: "3.8.10",
            path: "/usr/bin/python3"
          },
          package_manager: "pip",
          dependencies: [
            {
              name: "requests",
              version: "2.25.1",
              source: "pypi"
            },
            {
              name: "flask",
              version: "2.0.1",
              source: "pypi"
            }
          ]
        }
      ],
      performance_metrics: {
        cpu_usage: Math.floor(Math.random() * 100),
        memory_usage: Math.floor(Math.random() * 8 * 1024 * 1024 * 1024),
        scan_duration: Math.floor(Math.random() * 120),
        root_required: true
      }
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Server className="h-5 w-5 text-gray-400" />;
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
          <h1 className="text-3xl font-bold">Bulk Scan</h1>
          <p className="text-gray-500 dark:text-gray-400">Scan multiple systems at once</p>
        </div>
      </div>

      {errors.general && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Systems to Scan</CardTitle>
          <CardDescription>
            Import a list of hostnames or IP addresses to scan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" onValueChange={setMode}>
            <TabsList className="mb-4">
              <TabsTrigger value="file">
                <FileUp className="w-4 h-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="manual">
                <PanelRight className="w-4 h-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center ${
                    dragActive 
                      ? "border-blue-400 bg-blue-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ServerCrash className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Upload Hosts List</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload a CSV, TXT, or JSON file containing hostnames or IP addresses
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.txt,.json"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Select File
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">
                    One hostname or IP per line for TXT files. For CSV, include 'hostname' and 'ip' columns.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <FileUp className="h-10 w-10 text-blue-500 mr-4" />
                    <div className="flex-grow">
                      <p className="font-semibold">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setFile(null)}
                      className="text-gray-500"
                      disabled={isProcessing}
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing file...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              )}
              
              {errors.file && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.file}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="manual">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hosts">Enter Hostnames or IP Addresses</Label>
                  <Textarea
                    id="hosts"
                    placeholder="Enter one host per line, e.g.:
server1.example.com
192.168.1.10
db.internal"
                    value={manualList}
                    onChange={(e) => setManualList(e.target.value)}
                    className="mt-1 h-[200px] font-mono"
                  />
                </div>
                <Button onClick={processManualList}>
                  <Server className="w-4 h-4 mr-2" />
                  Add Hosts
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {hostsList.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Systems to Scan ({hostsList.length})</CardTitle>
            <Button 
              onClick={startScans} 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Scans
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostsList.map((host, index) => (
                  <TableRow key={index} className={currentHostIndex === index ? "bg-blue-50" : ""}>
                    <TableCell>{getStatusIcon(host.status)}</TableCell>
                    <TableCell>{host.hostname || "-"}</TableCell>
                    <TableCell>{host.ip || "-"}</TableCell>
                    <TableCell className="text-right">
                      {host.status === "completed" && scanResults[host.hostname || host.ip] && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(createPageUrl("Dashboard"))}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {host.status === "failed" && (
                        <span className="text-sm text-red-500">{host.error}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              {hostsList.filter(h => h.status === "completed").length} of {hostsList.length} scans completed
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}