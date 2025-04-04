
import React, { useState, useRef, useCallback } from 'react';
import { ScanResult } from '@/api/entities';
import { ImportedScan } from '@/api/entities';
import { ExtractDataFromUploadedFile, UploadFile } from "@/api/integrations";
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
  FileUp, ArrowLeft, Upload, Check, AlertCircle, Loader2, File, Server, CheckCircle, Trash2
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function Import() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState("syft-json");
  const [hostname, setHostname] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedScan, setImportedScan] = useState(null);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    setError(null);
    setFile(selectedFile);
    setFileName(selectedFile.name);
  };

  const resetForm = () => {
    setFile(null);
    setFileName("");
    setFormat("syft-json");
    setHostname("");
    setIsUploading(false);
    setUploadProgress(0);
    setIsProcessing(false);
    setImportedScan(null);
    setError(null);
  };

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    if (!hostname.trim()) {
      setError("Please enter a hostname");
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadSuccess(false);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return Math.min(90, prev + 5);
        });
      }, 100);
      
      // Upload file
      const { file_url } = await UploadFile({ file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create imported scan record
      const importData = {
        file_url,
        file_name: fileName,
        format,
        import_date: new Date().toISOString(),
        hostname,
        status: "imported"
      };
      
      const newImport = await ImportedScan.create(importData);
      setImportedScan(newImport);
      setIsUploading(false);
      setUploadSuccess(true);
      
      // Automatically process the import after successful upload
      setTimeout(() => {
        processImport();
      }, 1000);
      
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setError("Error uploading file: " + (err.message || "Unknown error"));
      console.error("Upload error:", err);
    }
  };

  const processImport = async () => {
    if (!importedScan) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Extract data from the uploaded Syft file
      const { file_url, format } = importedScan;
      
      const extractionSchema = {
        type: "object",
        properties: {
          artifacts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                version: { type: "string" },
                type: { type: "string" },
                foundBy: { type: "string" },
                language: { type: "string" },
                purl: { type: "string" },
                licenses: { 
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          },
          source: {
            type: "object",
            properties: {
              type: { type: "string" },
              target: { type: "object" },
              distro: { 
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                  idLike: { type: "string" }
                }
              }
            }
          }
        }
      };

      // Extract structured data from the Syft file
      const { status, output, details } = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: extractionSchema
      });

      if (status === "error") {
        throw new Error(`Failed to parse Syft output: ${details}`);
      }

      const { artifacts = [], source = {} } = output || {};
      
      // Create a new scan result with the extracted data
      const currentDate = new Date().toISOString();
      
      // Group artifacts by type and language
      const packagesByType = new Map();
      const languageEnvs = new Map();

      artifacts.forEach(artifact => {
        const type = artifact.type?.toLowerCase() || 'unknown';
        const language = artifact.language?.toLowerCase();
        
        if (language) {
          if (!languageEnvs.has(language)) {
            languageEnvs.set(language, []);
          }
          languageEnvs.get(language).push({
            name: artifact.name,
            version: artifact.version,
            source: artifact.purl || artifact.foundBy || 'unknown',
            licenses: artifact.licenses || []
          });
        } else {
          if (!packagesByType.has(type)) {
            packagesByType.set(type, []);
          }
          packagesByType.get(type).push({
            name: artifact.name,
            version: artifact.version,
            source: artifact.purl || artifact.foundBy || 'unknown',
            licenses: artifact.licenses || []
          });
        }
      });

      const newScanResult = {
        hostname: importedScan.hostname,
        scan_date: currentDate,
        scan_config: {
          output_format: importedScan.format,
          storage_type: "local",
          compression: false
        },
        os_info: {
          name: source.distro?.name || "Linux",
          distribution: source.distro?.name || "Unknown",
          version: source.distro?.version || "Unknown",
          architecture: source.distro?.idLike || "x86_64"
        },
        package_managers: Array.from(packagesByType.entries())
          .filter(([type]) => ['deb', 'rpm', 'apk'].includes(type))
          .map(([type, packages]) => ({
            name: type,
            packages
          })),
        programming_environments: Array.from(languageEnvs.entries())
          .map(([language, dependencies]) => ({
            runtime: {
              name: language,
              version: "detected",
              path: "/usr/local/bin"
            },
            package_manager: language,
            dependencies
          })),
        performance_metrics: {
          cpu_usage: 0,
          memory_usage: 0,
          scan_duration: 0,
          root_required: false
        },
        status: "completed"
      };

      // Create the scan result
      const scanResult = await ScanResult.create(newScanResult);
      
      // Update the imported scan with the scan result ID and packages count
      await ImportedScan.update(importedScan.id, {
        status: "processed",
        scan_result_id: scanResult.id,
        packages_count: artifacts.length
      });

      // Check Graviton compatibility for all components
      const compatibilityPromises = artifacts.map(async (artifact) => {
        if (!artifact.name || !artifact.version) return null;
        
        try {
          const compatibilityData = {
            package_name: artifact.name,
            version_pattern: artifact.version,
            component_type: artifact.type || 'software_package',
            notes: `Detected in ${importedScan.format} scan`,
            source: artifact.purl || artifact.foundBy || 'scan_import',
            last_verified: currentDate
          };
          
          return await import('@/api/entities').then(({ GravitonCompatibility }) => 
            GravitonCompatibility.create(compatibilityData)
          );
        } catch (err) {
          console.error(`Failed to check compatibility for ${artifact.name}:`, err);
          return null;
        }
      });

      await Promise.all(compatibilityPromises);
      
      // Redirect to the dashboard after successful processing
      navigate(createPageUrl("Dashboard"));
      
    } catch (err) {
      setError("Error processing import: " + (err.message || "Unknown error"));
      console.error("Processing error:", err);
      setIsProcessing(false);
      
      // Update import status to error
      if (importedScan) {
        await ImportedScan.update(importedScan.id, {
          status: "error",
          error_message: err.message || "Unknown error"
        });
      }
    }
  };

  const deleteImportedScan = async () => {
    if (!importedScan) return;

    try {
      setError(null);
      setIsProcessing(true);

      // Delete the imported scan record
      await ImportedScan.delete(importedScan.id);

      // Reset the form
      resetForm();
      setIsProcessing(false);
      navigate(createPageUrl("Dashboard"));
    } catch (err) {
      setError("Error deleting import: " + (err.message || "Unknown error"));
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
          <p className="text-gray-500 dark:text-gray-400">Upload and process Syft scan outputs</p>
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
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-50">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Upload Successful</AlertTitle>
          <AlertDescription>
            Your file "{fileName}" was successfully uploaded and ready for processing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white">Import Syft Output</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Upload a Syft scan output file to analyze and process
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center ${
                  dragActive 
                    ? "border-blue-400 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600 dark:bg-slate-900 dark:text-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-700">
                  <FileUp className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Upload Syft Output File</h3>
                <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                  Drag and drop your Syft output file here or click to browse
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
                >
                  <Upload className="w-4 h-4" />
                  Select File
                </Button>
                <p className="text-xs text-gray-400 mt-4 dark:text-gray-500">
                  Supported formats: JSON, XML, Tag-Value
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center p-4 border rounded-lg dark:border-slate-700 dark:bg-slate-800">
                  <File className="h-10 w-10 text-blue-500 mr-4" />
                  <div className="flex-grow">
                    <p className="font-semibold dark:text-white">{fileName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setFile(null);
                      setUploadSuccess(false);
                    }}
                    className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="format" className="dark:text-gray-300">File Format</Label>
                    <Select value={format} onValueChange={setFormat} disabled={isUploading}>
                      <SelectTrigger id="format" className="dark:bg-slate-700 dark:border-slate-700 dark:text-gray-300">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300">
                        {formatOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="dark:hover:bg-slate-700">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="hostname" className="dark:text-gray-300">System Hostname/Identifier</Label>
                    <div className="flex gap-2">
                      <Server className="w-4 h-4 text-gray-500 mt-2.5 dark:text-gray-400" />
                      <Input
                        id="hostname"
                        placeholder="Enter system name or identifier"
                        value={hostname}
                        onChange={(e) => setHostname(e.target.value)}
                        disabled={isUploading}
                        className="dark:bg-slate-700 dark:border-slate-700 dark:text-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm dark:text-gray-300">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            {!importedScan ? (
              <Button 
                onClick={uploadFile} 
                disabled={!file || isUploading || !hostname}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={deleteImportedScan}
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
                  onClick={processImport} 
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-800 dark:hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Process Import
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>

        {importedScan && !isProcessing && (
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File Name</p>
                    <p className="font-medium dark:text-gray-300">{importedScan.file_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</p>
                    <p className="font-medium dark:text-gray-300">{formatOptions.find(f => f.value === importedScan.format)?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Import Date</p>
                    <p className="font-medium dark:text-gray-300">{format(new Date(importedScan.import_date), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hostname</p>
                    <p className="font-medium dark:text-gray-300">{importedScan.hostname}</p>
                  </div>
                </div>
                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700">
                  <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <AlertDescription className="dark:text-gray-300">
                    Click "Process Import" to analyze the Syft output and create a scan result
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
