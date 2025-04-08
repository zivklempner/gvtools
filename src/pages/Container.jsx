
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Database,
  Layers,
  AlertCircle,
  PackageCheck,
  Clock,
  Loader2,
  Download,
  Code
} from "lucide-react";

export default function Container() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("cyclonedx-json");
  const [error, setError] = useState(null);
  
  const handleSearch = () => {
    if (!searchTerm) return;
    
    setIsSearching(true);
    setError(null);
    
    // Simulate API call to search container images
    setTimeout(() => {
      // Mock search results
      const results = [
        { 
          name: "nginx", 
          tags: ["latest", "1.21", "1.20", "alpine"],
          stars: 15234,
          pulls: "1B+",
          official: true
        },
        { 
          name: "node", 
          tags: ["16", "14", "alpine", "slim"],
          stars: 12456,
          pulls: "500M+",
          official: true
        },
        { 
          name: "python", 
          tags: ["3.10", "3.9", "slim", "alpine"],
          stars: 10234,
          pulls: "900M+",
          official: true
        }
      ].filter(img => img.name.includes(searchTerm.toLowerCase()));
      
      setSearchResults(results);
      setIsSearching(false);
    }, 1500);
  };
  
  const selectImage = (image, tag) => {
    setSelectedImage({
      ...image,
      selectedTag: tag,
      fullName: `${image.name}:${tag}`
    });
  };
  
  const scanImage = () => {
    if (!selectedImage) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setError(null);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);
    
    // Simulate scan completion after 6 seconds
    setTimeout(() => {
      clearInterval(interval);
      setScanProgress(100);
      
      // Mock scan results
      setScanResults({
        image: selectedImage.fullName,
        scannedAt: new Date().toISOString(),
        packages: [
          { name: "openssl", version: "1.1.1k", licenses: ["OpenSSL"], vulnerabilities: 2 },
          { name: "curl", version: "7.79.1", licenses: ["MIT"], vulnerabilities: 0 },
          { name: "zlib", version: "1.2.11", licenses: ["Zlib"], vulnerabilities: 1 },
          { name: "libc", version: "2.33", licenses: ["GPL-2.0", "LGPL-2.1"], vulnerabilities: 0 },
          { name: "pcre", version: "8.45", licenses: ["BSD-3-Clause"], vulnerabilities: 0 },
          { name: "gzip", version: "1.10", licenses: ["GPL-3.0"], vulnerabilities: 0 },
          { name: "libxml2", version: "2.9.12", licenses: ["MIT"], vulnerabilities: 3 },
          { name: "nodejs", version: "16.13.0", licenses: ["MIT"], vulnerabilities: 1 }
        ],
        operatingSystem: "Alpine Linux 3.14",
        packageSummary: {
          total: 67,
          withVulnerabilities: 4,
          withoutLicense: 2
        },
        runtime: {
          scanDuration: "18.5s",
          memoryUsed: "87.2 MB"
        }
      });
      
      setIsScanning(false);
    }, 6000);
  };
  
  const resetScan = () => {
    setScanResults(null);
    setSelectedImage(null);
    setScanProgress(0);
  };
  
  const downloadSBOM = () => {
    // In a real app, this would download the actual SBOM file
    alert(`Downloading SBOM for ${selectedImage.fullName} in ${selectedFormat} format`);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Container Image Analysis</h1>
          <p className="text-gray-500">Scan container images to generate SBOM and detect vulnerabilities</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {!scanResults ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Search Container Images</CardTitle>
                <CardDescription>
                  Search for public container images to analyze
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex w-full max-w-lg items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search for container images..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchTerm}
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Search Results</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Image</TableHead>
                            <TableHead>Popular Tags</TableHead>
                            <TableHead>Stars</TableHead>
                            <TableHead>Pulls</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {searchResults.map((image) => (
                            <TableRow key={image.name}>
                              <TableCell className="font-medium flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-500" />
                                {image.name}
                                {image.official && (
                                  <Badge variant="outline" className="text-xs ml-1">
                                    Official
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {image.tags.map(tag => (
                                    <Badge 
                                      key={tag} 
                                      variant="outline"
                                      className="cursor-pointer hover:bg-blue-50"
                                      onClick={() => selectImage(image, tag)}
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{image.stars.toLocaleString()}</TableCell>
                              <TableCell>{image.pulls}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Select onValueChange={(tag) => selectImage(image, tag)}>
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Tag" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {image.tags.map(tag => (
                                        <SelectItem key={tag} value={tag}>
                                          {tag}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    {selectedImage.fullName}
                  </CardTitle>
                  <CardDescription>
                    Selected container image to analyze
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {isScanning && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Scanning progress...</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <Progress value={scanProgress} />
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="output_format">Output Format</Label>
                        <Select 
                          value={selectedFormat}
                          onValueChange={setSelectedFormat}
                        >
                          <SelectTrigger id="output_format" className="w-40">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                            <SelectItem value="spdx-tag-value">SPDX Tag-Value</SelectItem>
                            <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                            <SelectItem value="cyclonedx-xml">CycloneDX XML</SelectItem>
                            <SelectItem value="syft-json">Syft JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={scanImage}
                        disabled={isScanning}
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Generate SBOM
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    SBOM Results for {scanResults.image}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Scanned at {new Date(scanResults.scannedAt).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={selectedFormat}
                    onValueChange={setSelectedFormat}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                      <SelectItem value="spdx-tag-value">SPDX Tag-Value</SelectItem>
                      <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                      <SelectItem value="cyclonedx-xml">CycloneDX XML</SelectItem>
                      <SelectItem value="syft-json">Syft JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    onClick={downloadSBOM}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download SBOM
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold">{scanResults.packageSummary.total}</div>
                        <div className="text-sm text-gray-500">Total Packages</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-red-600">{scanResults.packageSummary.withVulnerabilities}</div>
                        <div className="text-sm text-gray-500">Vulnerable Packages</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-amber-600">{scanResults.packageSummary.withoutLicense}</div>
                        <div className="text-sm text-gray-500">No License Info</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-blue-600">{scanResults.runtime.scanDuration}</div>
                        <div className="text-sm text-gray-500">Scan Duration</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detected Packages</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Package</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>License</TableHead>
                                <TableHead>Vulnerabilities</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scanResults.packages.map((pkg, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-medium">{pkg.name}</TableCell>
                                  <TableCell>{pkg.version}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {pkg.licenses.map((license, j) => (
                                        <Badge key={j} variant="outline">
                                          {license}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {pkg.vulnerabilities > 0 ? (
                                      <Badge variant="destructive">
                                        {pkg.vulnerabilities}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                        None
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">System Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">Operating System</Label>
                              <p className="font-medium">{scanResults.operatingSystem}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Base Image</Label>
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-gray-500" />
                                <p>{scanResults.image.split(':')[0]}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Tag</Label>
                              <Badge className="mt-1">
                                {scanResults.image.split(':')[1]}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Performance Metrics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>Scan Duration</span>
                              </div>
                              <span className="font-medium">{scanResults.runtime.scanDuration}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4 text-gray-500" />
                                <span>Memory Usage</span>
                              </div>
                              <span className="font-medium">{scanResults.runtime.memoryUsed}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={resetScan}
              >
                Scan Another Image
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
