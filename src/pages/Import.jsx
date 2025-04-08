
import React, { useState, useRef, useCallback } from 'react';
import { ScanResult } from '@/api/entities';
import { ImportedScan } from '@/api/entities';
import { UploadFile } from "@/api/integrations";
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
import { 
  FileUp, ArrowLeft, Upload, Check, AlertCircle, Loader2, File, Server, CheckCircle, Trash2, Plus
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { format as dateFormat } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("syft-json");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedScans, setImportedScans] = useState([]);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFiles([]);
    setFormat("syft-json");
    setIsUploading(false);
    setUploadProgress(0);
    setIsProcessing(false);
    setImportedScans([]);
    setError(null);
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadSuccess(false);
      
      const progressStep = 100 / files.length;
      const uploadedScans = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate upload progress
        const baseProgress = i * progressStep;
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const targetProgress = baseProgress + progressStep * 0.9;
            if (prev >= targetProgress) {
              clearInterval(progressInterval);
              return prev;
            }
            return Math.min(targetProgress, prev + 0.5);
          });
        }, 50);
        
        // Upload file
        const { file_url } = await UploadFile({ file });
        
        clearInterval(progressInterval);
        
        // Create imported scan record
        const importData = {
          file_url,
          file_name: file.name,
          format,
          import_date: new Date().toISOString(),
          hostname: file.name.replace(/\.[^/.]+$/, ""), // Use filename (without extension) as default hostname
          status: "imported"
        };
        
        const newImport = await ImportedScan.create(importData);
        uploadedScans.push(newImport);
        
        setUploadProgress(baseProgress + progressStep);
      }
      
      setImportedScans(uploadedScans);
      setIsUploading(false);
      setUploadSuccess(true);
      
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setError("Error uploading files: " + (err.message || "Unknown error"));
      console.error("Upload error:", err);
    }
  };

  const processImports = async () => {
    if (importedScans.length === 0) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Get project ID from session storage
      const projectId = sessionStorage.getItem('currentProjectId');
      if (!projectId) {
        throw new Error("No project selected. Please select a project first.");
      }
      
      // Process each imported scan
      for (const importedScan of importedScans) {
        await processImportedScan(importedScan, projectId);
      }
      
      // Redirect to dashboard
      navigate(createPageUrl("Dashboard"));
      
    } catch (err) {
      setError("Error processing imports: " + (err.message || "Unknown error"));
      console.error("Processing error:", err);
      setIsProcessing(false);
    }
  };

  const processImportedScan = async (importedScan, projectId) => {
    try {
      // Update this scan's status to processing
      await ImportedScan.update(importedScan.id, { status: "processing" });
      
      const { file_url, format, hostname } = importedScan;
      
      if (format.includes('json')) {
        // Fetch and process JSON data
        const response = await fetch(file_url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        // This is a simplified example - in a real implementation,
        // you would need more complex processing based on the format
        const data = await response.json();
        
        // Create a scan result with the data
        const scanResult = await ScanResult.create({
          project_id: projectId,
          hostname: hostname,
          scan_date: data.scan_date || new Date().toISOString(),
          status: "completed",
          // Add other data fields as needed
          os_info: data.os_info || { name: "Unknown", distribution: hostname }
        });
        
        // Update the imported scan status
        await ImportedScan.update(importedScan.id, {
          status: "processed",
          scan_result_id: scanResult.id
        });
      } else {
        // Handle other formats
        throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      // Mark this import as failed
      await ImportedScan.update(importedScan.id, {
        status: "error",
        error_message: error.message
      });
      throw error;
    }
  };

  const deleteImportedScans = async () => {
    if (importedScans.length === 0) return;

    try {
      setError(null);
      setIsProcessing(true);

      // Delete all imported scan records
      for (const scan of importedScans) {
        await ImportedScan.delete(scan.id);
      }

      // Reset the form
      resetForm();
      setIsProcessing(false);
      navigate(createPageUrl("Dashboard"));
    } catch (err) {
      setError("Error deleting imports: " + (err.message || "Unknown error"));
      console.error("Deletion error:", err);
      setIsProcessing(false);
    }
  };

  const formatOptions = [
    { value: "syft-json", label: "Syft JSON" },
    { value: "syft-text", label: "Syft Text" },
    { value: "cyclonedx-xml", label: "CycloneDX XML (1.6)" },
    { value: "cyclonedx-xml-1.5", label: "CycloneDX XML (1.5)" },
    { value: "cyclonedx-json", label: "CycloneDX JSON (1.6)" },
    { value: "cyclonedx-json-1.5", label: "CycloneDX JSON (1.5)" },
    { value: "spdx-tag-value", label: "SPDX Tag-Value (2.3)" },
    { value: "spdx-tag-value-2.2", label: "SPDX Tag-Value (2.2)" },
    { value: "spdx-json", label: "SPDX JSON (2.3)" },
    { value: "spdx-json-2.2", label: "SPDX JSON (2.2)" },
    { value: "github-json", label: "GitHub JSON" },
    { value: "syft-table", label: "Syft Table" }
  ];

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
          <h1 className="text-3xl font-bold">Import Syft Scan</h1>
          <p className="text-gray-500">Upload and process Syft scan outputs</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && !error && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-900">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Upload Successful</AlertTitle>
          <AlertDescription>
            Your files were successfully uploaded and ready for processing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Import Syft Output</CardTitle>
            <CardDescription>
              Upload one or more Syft scan output files to analyze and process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
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
                  <FileUp className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload Syft Output Files</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Drag and drop your Syft output files here or click to browse
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Select Files
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: JSON, XML, Tag-Value
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-base font-medium">Selected Files</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add More
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-blue-500" />
                              {file.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(file.size / 1024).toFixed(2)} KB
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-700"
                              onClick={() => removeFile(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="format">File Format</Label>
                    <Select value={format} onValueChange={setFormat} disabled={isUploading}>
                      <SelectTrigger id="format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {formatOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            {importedScans.length === 0 ? (
              <Button 
                onClick={uploadFiles} 
                disabled={files.length === 0 || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Files
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={deleteImportedScans}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
                <Button 
                  onClick={processImports} 
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Process Imports
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        {importedScans.length > 0 && !isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Import Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-blue-500" />
                            {scan.file_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatOptions.find(f => f.value === scan.format)?.label || scan.format}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-gray-500" />
                            {scan.hostname}
                          </div>
                        </TableCell>
                        <TableCell>
                          {dateFormat(new Date(scan.import_date), "PPP")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertDescription>
                    Click "Process Imports" to analyze these files and create scan results
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
