import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";
import { 
  FileUp, 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  Loader2, 
  File, 
  Trash2 
} from "lucide-react";

export default function Import() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importFormat, setImportFormat] = useState("syft-json");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);
  const projectId = sessionStorage.getItem('currentProjectId');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportProgress(0);

    try {
      // Upload file
      setImportProgress(20);
      const { file_url } = await UploadFile({ file });

      // Process the file
      setImportProgress(60);
      await new Promise(r => setTimeout(r, 1000)); // Simulate processing

      // Create scan result
      setImportProgress(90);
      await ScanResult.create({
        project_id: projectId,
        hostname: "imported-system",
        scan_date: new Date().toISOString(),
        status: "completed"
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

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a project first
          </AlertDescription>
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
          <p className="text-gray-500">Import existing scan outputs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Scan File</CardTitle>
          <CardDescription>
            Select a scan output file to import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-5 w-5 text-blue-500" />
                  <span>{fileName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setFileName("");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              )}
            </div>

            <div>
              <Label>Import Format</Label>
              <Select value={importFormat} onValueChange={setImportFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="syft-json">Syft JSON</SelectItem>
                  <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                  <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {importError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{importError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isImporting && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Import Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing file...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}