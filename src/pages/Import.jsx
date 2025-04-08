import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { ImportedScan } from '@/api/entities';
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
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

export default function ImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importFormat, setImportFormat] = useState("syft-json");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState(null);
  const [importedScans, setImportedScans] = useState([]);
  const [hostname, setHostname] = useState("");
  const fileInputRef = useRef(null);
  const projectId = sessionStorage.getItem('currentProjectId');

  useEffect(() => {
    loadImportedScans();
  }, []);

  const loadImportedScans = async () => {
    try {
      const scans = await ImportedScan.list('-import_date');
      setImportedScans(scans);
    } catch (error) {
      console.error("Error loading imported scans:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // Auto-detect format from filename
      if (selectedFile.name.includes('syft') && selectedFile.name.endsWith('.json')) {
        setImportFormat('syft-json');
      } else if (selectedFile.name.includes('cyclonedx') && selectedFile.name.endsWith('.json')) {
        setImportFormat('cyclonedx-json');
      } else if (selectedFile.name.includes('cyclonedx') && selectedFile.name.endsWith('.xml')) {
        setImportFormat('cyclonedx-xml');
      } else if (selectedFile.name.includes('spdx') && selectedFile.name.endsWith('.json')) {
        setImportFormat('spdx-json');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportError("Please select a file to import");
      return;
    }
    
    if (!projectId) {
      setImportError("Please select a project first");
      return;
    }

    if (!hostname.trim()) {
      setImportError("Please enter a hostname or system identifier");
      return;
    }
    
    setIsImporting(true);
    setImportError(null);
    setImportProgress(0);
    
    try {
      // Upload file
      setImportProgress(20);
      const { file_url } = await UploadFile({ file });
      
      // Record the import
      setImportProgress(40);
      const importRecord = await ImportedScan.create({
        file_url,
        file_name: fileName,
        format: importFormat,
        import_date: new Date().toISOString(),
        hostname,
        status: 'imported'
      });
      
      // Simulate package extraction (this would normally parse the file)
      setImportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create scan result
      setImportProgress(80);
      const scanResult = await ScanResult.create({
        project_id: projectId,
        hostname,
        scan_date: new Date().toISOString(),
        status: 'completed',
        os_info: {
          name: "Linux",
          distribution: "Ubuntu",
          version: "20.04",
          architecture: "x86_64"
        },
        package_managers: [
          {
            name: "apt",
            packages: [
              { name: "python3", version: "3.8.10", source: "ubuntu", licenses: ["PSF"] },
              { name: "nodejs", version: "14.17.0", source: "nodejs", licenses: ["MIT"] }
            ]
          }
        ]
      });
      
      // Update import record with scan result ID
      setImportProgress(90);
      await ImportedScan.update(importRecord.id, {
        status: 'processed',
        packages_count: 2, // Example count
        scan_result_id: scanResult.id
      });
      
      setImportProgress(100);
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1000);
      
    } catch (error) {
      console.error("Import error:", error);
      setImportError(error.message || "An error occurred during import");
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
    setImportError(null);
  };

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No project selected</AlertTitle>
          <AlertDescription>
            Please select a project before importing scan data.
          </AlertDescription>
          <Button 
            className="mt-4 w-full"
            onClick={() => navigate(createPageUrl("Projects"))}
          >
            Go to Projects
          </Button>
        </Alert>
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
          <h1 className="text-3xl font-bold">Import Scan Data</h1>
          <p className="text-gray-500">Import existing Syft or SBOM scan outputs</p>
        </div>
      </div>

      {isImporting ? (
        <Card>
          <CardHeader>
            <CardTitle>Importing Scan Data</CardTitle>
            <CardDescription>
              Processing {fileName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing and processing...</span>
                <span>{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Scan Data</CardTitle>
              <CardDescription>
                Import scan data from Syft, CycloneDX or SPDX scan outputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="hostname" className="mb-2 block">
                  Hostname or System Identifier
                </Label>
                <Input 
                  id="hostname" 
                  placeholder="e.g., web-server-01"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                />
              </div>
              
              <div className="border border-dashed rounded-lg p-6">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 p-3 bg-blue-50 rounded-full">
                    <FileUp className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-medium">Upload Scan Output</h3>
                  
                  {fileName ? (
                    <div className="mt-4 flex items-center justify-center gap-2 p-2 bg-blue-50 rounded-lg w-full">
                      <File className="h-4 w-4 text-blue-500" />
                      <span className="font-medium truncate max-w-xs">{fileName}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearFile}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mt-2 mb-6">
                        Supported formats: Syft JSON, CycloneDX JSON/XML, SPDX JSON
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,.xml,.txt,.sbom"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {fileName && (
                <div>
                  <Label htmlFor="format" className="mb-2 block">
                    File Format
                  </Label>
                  <Select value={importFormat} onValueChange={setImportFormat}>
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="syft-json">Syft JSON</SelectItem>
                      <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                      <SelectItem value="cyclonedx-xml">CycloneDX XML</SelectItem>
                      <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                      <SelectItem value="github-json">GitHub Dependency JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {importError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleImport}
                disabled={!file || !hostname.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Scan Data
              </Button>
            </CardFooter>
          </Card>
          
          {/* Previous Imports */}
          {importedScans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Imports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hostname
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Format
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Import Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importedScans.map((scan) => (
                        <tr key={scan.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Server className="flex-shrink-0 h-4 w-4 text-gray-400 mr-2" />
                              <div className="ml-1 font-medium text-gray-900">
                                {scan.hostname}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {scan.format}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(scan.import_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.status === 'processed' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Processed
                              </span>
                            ) : scan.status === 'error' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                Imported
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {scan.scan_result_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  sessionStorage.setItem('selectedSystemId', scan.scan_result_id);
                                  navigate(createPageUrl(`GravitonCompatibility?scanId=${scan.scan_result_id}`));
                                }}
                              >
                                View Analysis
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}