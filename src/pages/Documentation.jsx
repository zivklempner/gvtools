
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertCircle, Construction, Server, Terminal, Download, Copy, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function DocumentationPage() {
  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // For HTTPS or localhost
        await navigator.clipboard.writeText(text);
        alert("Command copied to clipboard!");
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          textArea.remove();
          alert("Command copied to clipboard!");
        } catch (err) {
          console.error("Copy failed", err);
          alert("Failed to copy command. Please copy it manually.");
        }
      }
    } catch (err) {
      console.error("Copy failed", err);
      alert("Failed to copy command. Please copy it manually.");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">GVTools Installation Guide</h1>
        <p className="text-gray-500">Installation instructions for various Linux distributions</p>
      </div>

      <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          <strong>IMPORTANT:</strong> GVTools is currently in development. The installation commands shown here are examples of how the installation will work when the product is officially released. The URLs and package names are placeholders and won't work until official release.
        </AlertDescription>
      </Alert>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              System Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>CPU:</strong> 2+ cores recommended</li>
              <li><strong>Memory:</strong> 4GB RAM minimum, 8GB recommended</li>
              <li><strong>Disk Space:</strong> 500MB for installation, plus storage space for scan results</li>
              <li><strong>Operating System:</strong> Linux (kernel 4.0+)</li>
              <li><strong>Supported Distributions:</strong> Ubuntu 18.04+, Debian 10+, RHEL/CentOS 7+, Amazon Linux 2, SUSE 15+</li>
              <li><strong>Permissions:</strong> Root or sudo access required for installation and some scanning features</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Download className="h-5 w-5 text-green-500" /> 
              Installation Instructions
            </CardTitle>
            <CardDescription>
              Choose your Linux distribution for specific installation commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ubuntu" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4 lg:w-[400px]">
                <TabsTrigger value="ubuntu">Ubuntu/Debian</TabsTrigger>
                <TabsTrigger value="rhel">RHEL/CentOS</TabsTrigger>
                <TabsTrigger value="amazon">Amazon Linux</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ubuntu" className="space-y-4">
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">1. Add GPG key and repository</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common && curl -fsSL https://download.gvtools.io/linux/gpg | sudo apt-key add - && sudo add-apt-repository "deb [arch=amd64] https://download.gvtools.io/linux/apt stable main"')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common<br />
                      curl -fsSL https://download.gvtools.io/linux/gpg | sudo apt-key add -<br />
                      sudo add-apt-repository "deb [arch=amd64] https://download.gvtools.io/linux/apt stable main"
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">2. Install GVTools</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo apt-get update && sudo apt-get install -y gvtools')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo apt-get update && sudo apt-get install -y gvtools
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">3. Verify installation</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('gvtools --version')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      gvtools --version
                    </code>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rhel" className="space-y-4">
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">1. Add repository</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo rpm --import https://download.gvtools.io/linux/gpg && sudo yum-config-manager --add-repo https://download.gvtools.io/linux/yum/gvtools.repo')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo rpm --import https://download.gvtools.io/linux/gpg<br />
                      sudo yum-config-manager --add-repo https://download.gvtools.io/linux/yum/gvtools.repo
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">2. Install GVTools</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo yum install -y gvtools')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo yum install -y gvtools
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">3. Verify installation</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('gvtools --version')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      gvtools --version
                    </code>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="amazon" className="space-y-4">
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">1. Add repository</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo rpm --import https://download.gvtools.io/linux/gpg && sudo amazon-linux-extras install -y epel && sudo yum-config-manager --add-repo https://download.gvtools.io/linux/yum/amzn2/gvtools.repo')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo rpm --import https://download.gvtools.io/linux/gpg<br />
                      sudo amazon-linux-extras install -y epel<br />
                      sudo yum-config-manager --add-repo https://download.gvtools.io/linux/yum/amzn2/gvtools.repo
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">2. Install GVTools</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('sudo yum install -y gvtools')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      sudo yum install -y gvtools
                    </code>
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-gray-500">3. Verify installation</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyToClipboard('gvtools --version')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                    <code>
                      gvtools --version
                    </code>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Terminal className="h-5 w-5 text-purple-500" />
              Docker Installation
            </CardTitle>
            <CardDescription>
              Alternative installation using Docker
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm text-gray-500">Pull the GVTools Docker image</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => copyToClipboard('docker pull gvtools/scanner:latest')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                <code>
                  docker pull gvtools/scanner:latest
                </code>
              </div>
            </div>

            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm text-gray-500">Run a basic scan using Docker</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => copyToClipboard('docker run --rm -v $(pwd):/data gvtools/scanner:latest analyze --target /data/my-app')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-black rounded-md p-3 text-gray-100 font-mono text-sm overflow-x-auto">
                <code>
                  docker run --rm -v $(pwd):/data gvtools/scanner:latest analyze --target /data/my-app
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
