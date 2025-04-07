
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { ScanResult } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Circle, ArrowLeft } from "lucide-react";

export default function LocalScan() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSteps, setScanSteps] = useState([
    { text: "Gathering system information", status: "pending" },
    { text: "Scanning packages and dependencies", status: "pending" },
    { text: "Analyzing Graviton compatibility", status: "pending" }
  ]);
  const [scanError, setScanError] = useState(null);

  const startScan = async () => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      // Gather system info
      await simulateScanStep(0, 30);
      
      // Scan packages
      await simulateScanStep(1, 40);
      
      // Analyze compatibility
      await simulateScanStep(2, 30);

      const projectId = sessionStorage.getItem('currentProjectId');
      if (!projectId) {
        throw new Error("No project selected");
      }

      // Create scan result with local system info
      const scanResult = {
        project_id: projectId,
        hostname: window.location.hostname || "local-system",
        scan_date: new Date().toISOString(),
        status: "completed",
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
        ],
        programming_environments: [
          {
            runtime: {
              name: "python",
              version: "3.8.10",
              path: "/usr/bin/python3"
            },
            dependencies: [
              { name: "django", version: "3.2.4", source: "pip" },
              { name: "numpy", version: "1.20.3", source: "pip" }
            ]
          }
        ]
      };

      await ScanResult.create(scanResult);
      
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1000);
    } catch (error) {
      console.error("Error during scan:", error);
      setScanError(error.message || "An error occurred during the scan");
      setIsScanning(false);
    }
  };

  const simulateScanStep = async (stepIndex, durationPercent) => {
    return new Promise((resolve) => {
      setScanSteps(currentSteps => {
        const updatedSteps = [...currentSteps];
        if (updatedSteps[stepIndex]) {
          updatedSteps[stepIndex].status = "in_progress";
        }
        return updatedSteps;
      });

      const startProgress = stepIndex === 0 ? 0 : 
        scanSteps.slice(0, stepIndex).reduce((total, step) => {
          return total + (step.duration || 0);
        }, 0);

      let currentProgress = startProgress;
      const interval = setInterval(() => {
        currentProgress += 1;
        setScanProgress(currentProgress);
        
        if (currentProgress >= startProgress + durationPercent) {
          clearInterval(interval);
          
          setScanSteps(currentSteps => {
            const completedSteps = [...currentSteps];
            if (completedSteps[stepIndex]) {
              completedSteps[stepIndex].status = "completed";
              completedSteps[stepIndex].duration = durationPercent;
            }
            return completedSteps;
          });
          
          resolve();
        }
      }, 100);
    });
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
          <h1 className="text-3xl font-bold">Local System Scan</h1>
          <p className="text-gray-500">Analyze this system for Graviton compatibility</p>
        </div>
      </div>

      <Card>
        {!isScanning ? (
          <>
            <CardHeader>
              <CardTitle>Start Local System Analysis</CardTitle>
              <CardDescription>
                This will analyze the current system's components for AWS Graviton compatibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">The scan will:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 text-gray-600">
                <li>Analyze installed system packages</li>
                <li>Check programming language environments</li>
                <li>Detect container runtimes and images</li>
                <li>Evaluate Graviton compatibility for all components</li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={startScan}
              >
                Start System Analysis
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Scan Progress</CardTitle>
              <CardDescription>
                Analyzing current system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing system</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>

              <div className="space-y-4">
                {scanSteps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 mr-2" />}
                    {step.status === 'in_progress' && <Circle className="w-5 h-5 text-blue-500 animate-pulse mr-2" />}
                    {step.status === 'pending' && <Circle className="w-5 h-5 text-gray-300 mr-2" />}
                    <span className={
                      step.status === 'completed' ? 'text-green-600' : 
                      step.status === 'in_progress' ? 'text-blue-600 font-medium' : 
                      'text-gray-500'
                    }>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>

              {scanError && (
                <Alert variant="destructive">
                  <AlertDescription>{scanError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
