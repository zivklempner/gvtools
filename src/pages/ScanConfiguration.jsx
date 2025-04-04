import React, { useState, useEffect } from 'react';
import { ScanConfig } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, Save, RotateCcw, PlusCircle, ListChecks, Database, FileSearch, GanttChart,
  Layers, ShieldCheck, X, Edit, Star, Trash2, Workflow, HelpCircle, Info
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

export default function ScanConfiguration() {
  const [configs, setConfigs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTab, setCurrentTab] = useState("saved");
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    source_type: 'container_image',
    source_path: '',
    output_format: 'cyclonedx-json',
    template_path: '',
    package_cataloging: true,
    file_cataloging: false,
    file_contents_cataloging: false,
    performance_profile: 'balanced',
    parallelism: 4,
    exclude_patterns: [],
    ci_integration: {
      enabled: false,
      fail_on_severity: 'high',
      summary_file: 'sbom-results.json'
    }
  });
  const [newExcludePattern, setNewExcludePattern] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await ScanConfig.list('-created_date');
      setConfigs(data);
      if (data.length > 0 && !selectedConfig) {
        setSelectedConfig(data[0]);
      }
    } catch (error) {
      console.error("Error loading scan configurations:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const newConfig = await ScanConfig.create(formValues);
      await loadConfigs();
      setIsCreating(false);
      setCurrentTab("saved");
      setSelectedConfig(newConfig);
    } catch (error) {
      console.error("Error creating scan configuration:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      await ScanConfig.update(selectedConfig.id, formValues);
      await loadConfigs();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating scan configuration:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await ScanConfig.delete(id);
      await loadConfigs();
      setSelectedConfig(configs.length > 1 ? configs[0] : null);
    } catch (error) {
      console.error("Error deleting scan configuration:", error);
    }
  };

  const startNew = () => {
    setFormValues({
      name: '',
      source_type: 'container_image',
      source_path: '',
      output_format: 'cyclonedx-json',
      template_path: '',
      package_cataloging: true,
      file_cataloging: false,
      file_contents_cataloging: false,
      performance_profile: 'balanced',
      parallelism: 4,
      exclude_patterns: [],
      ci_integration: {
        enabled: false,
        fail_on_severity: 'high',
        summary_file: 'sbom-results.json'
      }
    });
    setIsCreating(true);
    setCurrentTab("editor");
  };

  const startEdit = (config) => {
    setFormValues(config);
    setIsEditing(true);
    setCurrentTab("editor");
  };

  const cancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    setCurrentTab("saved");
  };

  const handleSelectConfig = (config) => {
    setSelectedConfig(config);
  };

  const addExcludePattern = () => {
    if (newExcludePattern.trim()) {
      setFormValues({
        ...formValues,
        exclude_patterns: [...(formValues.exclude_patterns || []), newExcludePattern.trim()]
      });
      setNewExcludePattern('');
    }
  };

  const removeExcludePattern = (index) => {
    const newPatterns = [...formValues.exclude_patterns];
    newPatterns.splice(index, 1);
    setFormValues({
      ...formValues, 
      exclude_patterns: newPatterns
    });
  };

  const getSourceTypeIcon = (type) => {
    switch (type) {
      case 'container_image':
        return <Database className="h-4 w-4" />;
      case 'filesystem':
        return <FileSearch className="h-4 w-4" />;
      case 'archive':
        return <Layers className="h-4 w-4" />;
      case 'oci_registry':
        return <Database className="h-4 w-4" />;
      case 'podman':
        return <Database className="h-4 w-4" />;
      case 'directory':
        return <FileSearch className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getSourceTypeLabel = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">SBOM Generation</h1>
          <p className="text-gray-500">Configure and manage SBOM generation profiles</p>
        </div>
        <Button 
          onClick={startNew} 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Configuration
        </Button>
      </div>

      <Tabs 
        value={currentTab} 
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="saved">
            <Star className="w-4 h-4 mr-2" />
            Saved Configurations
          </TabsTrigger>
          <TabsTrigger value="editor" disabled={!isCreating && !isEditing}>
            <Edit className="w-4 h-4 mr-2" />
            Configuration Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saved" className="mt-6">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Configurations</CardTitle>
                  <CardDescription>
                    Select a configuration to view or edit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    {configs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p>No configurations created yet.</p>
                        <Button 
                          onClick={startNew} 
                          variant="outline" 
                          className="mt-4"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Create Your First Configuration
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {configs.map((config) => (
                          <div
                            key={config.id}
                            onClick={() => handleSelectConfig(config)}
                            className={`p-4 rounded-lg cursor-pointer ${
                              selectedConfig?.id === config.id
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{config.name}</h3>
                              <Badge variant="outline" className="flex items-center gap-1">
                                {getSourceTypeIcon(config.source_type)}
                                <span>{getSourceTypeLabel(config.source_type)}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">
                              {config.source_path}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                {config.output_format}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Created: {format(new Date(config.created_date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-8">
              {selectedConfig ? (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold">{selectedConfig.name}</CardTitle>
                      <CardDescription className="mt-1.5">
                        {getSourceTypeLabel(selectedConfig.source_type)} Configuration
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => startEdit(selectedConfig)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(selectedConfig.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Database className="w-4 h-4 text-gray-500" />
                            Source Information
                          </h3>
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm text-gray-500">Type</p>
                                  <p className="font-medium">{getSourceTypeLabel(selectedConfig.source_type)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Path/URL</p>
                                  <p className="font-medium break-all">{selectedConfig.source_path}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Workflow className="w-4 h-4 text-gray-500" />
                            Output Settings
                          </h3>
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm text-gray-500">Format</p>
                                  <p className="font-medium">{selectedConfig.output_format}</p>
                                </div>
                                {selectedConfig.output_format === 'template' && (
                                  <div>
                                    <p className="text-sm text-gray-500">Template Path</p>
                                    <p className="font-medium">{selectedConfig.template_path || "Not specified"}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-gray-500" />
                          Cataloging Options
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                            <Switch checked={selectedConfig.package_cataloging} disabled />
                            <span>Package Cataloging</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                            <Switch checked={selectedConfig.file_cataloging} disabled />
                            <span>File Cataloging</span>
                          </div>
                          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
                            <Switch checked={selectedConfig.file_contents_cataloging} disabled />
                            <span>Content Cataloging</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <GanttChart className="w-4 h-4 text-gray-500" />
                          Performance Settings
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span>Profile</span>
                              <Badge>
                                {selectedConfig.performance_profile}
                              </Badge>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span>Parallelism</span>
                              <Badge>
                                {selectedConfig.parallelism} workers
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedConfig.exclude_patterns && selectedConfig.exclude_patterns.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <X className="w-4 h-4 text-gray-500" />
                            Excluded Patterns
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedConfig.exclude_patterns.map((pattern, index) => (
                              <Badge key={index} variant="secondary">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedConfig.ci_integration && selectedConfig.ci_integration.enabled && (
                        <div>
                          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-gray-500" />
                            CI/CD Integration
                          </h3>
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span>Fail on Severity</span>
                                  <Badge className="capitalize">
                                    {selectedConfig.ci_integration.fail_on_severity}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Summary Report</p>
                                  <p className="font-medium">{selectedConfig.ci_integration.summary_file}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button className="bg-green-600 hover:bg-green-700">
                      Generate SBOM
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center p-12">
                    <div className="text-center text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-medium mb-2">No Configuration Selected</h3>
                      <p className="mb-4">
                        Select a configuration from the list or create a new one.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={startNew}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Create New Configuration
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? "Create New Configuration" : "Edit Configuration"}
              </CardTitle>
              <CardDescription>
                Configure the settings for SBOM generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Configuration Name</Label>
                    <Input 
                      id="name" 
                      value={formValues.name}
                      onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                      placeholder="Enter a name for this configuration"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="source_type">Source Type</Label>
                    <Select 
                      value={formValues.source_type}
                      onValueChange={(value) => setFormValues({...formValues, source_type: value})}
                    >
                      <SelectTrigger id="source_type">
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="container_image">Container Image</SelectItem>
                        <SelectItem value="filesystem">Filesystem</SelectItem>
                        <SelectItem value="archive">Archive (tar, zip)</SelectItem>
                        <SelectItem value="oci_registry">OCI Registry</SelectItem>
                        <SelectItem value="podman">Podman Container</SelectItem>
                        <SelectItem value="directory">Directory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="source_path">
                    {formValues.source_type === 'container_image' ? 'Image Name' :
                     formValues.source_type === 'oci_registry' ? 'Registry URL' :
                     'Path'}
                  </Label>
                  <Input 
                    id="source_path"
                    value={formValues.source_path}
                    onChange={(e) => setFormValues({...formValues, source_path: e.target.value})}
                    placeholder={
                      formValues.source_type === 'container_image' ? 'e.g., nginx:latest' :
                      formValues.source_type === 'oci_registry' ? 'e.g., registry.example.com/image:tag' :
                      formValues.source_type === 'filesystem' ? 'e.g., /path/to/filesystem' :
                      formValues.source_type === 'archive' ? 'e.g., /path/to/archive.tar.gz' :
                      'e.g., /path/to/source'
                    }
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="output_format">Output Format</Label>
                    <Select 
                      value={formValues.output_format}
                      onValueChange={(value) => setFormValues({...formValues, output_format: value})}
                    >
                      <SelectTrigger id="output_format">
                        <SelectValue placeholder="Select output format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spdx-json">SPDX JSON</SelectItem>
                        <SelectItem value="spdx-tag-value">SPDX Tag-Value</SelectItem>
                        <SelectItem value="cyclonedx-json">CycloneDX JSON</SelectItem>
                        <SelectItem value="cyclonedx-xml">CycloneDX XML</SelectItem>
                        <SelectItem value="syft-json">Syft JSON</SelectItem>
                        <SelectItem value="template">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formValues.output_format === 'template' && (
                    <div className="grid gap-2">
                      <Label htmlFor="template_path">Template Path</Label>
                      <Input 
                        id="template_path"
                        value={formValues.template_path}
                        onChange={(e) => setFormValues({...formValues, template_path: e.target.value})}
                        placeholder="Path to template file"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Cataloging Options</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <Label htmlFor="package_cataloging" className="mb-1.5">Package Cataloging</Label>
                        <span className="text-xs text-gray-500">Catalog software packages</span>
                      </div>
                      <Switch
                        id="package_cataloging"
                        checked={formValues.package_cataloging}
                        onCheckedChange={(checked) => setFormValues({...formValues, package_cataloging: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <Label htmlFor="file_cataloging" className="mb-1.5">File Cataloging</Label>
                        <span className="text-xs text-gray-500">Catalog file digests</span>
                      </div>
                      <Switch
                        id="file_cataloging"
                        checked={formValues.file_cataloging}
                        onCheckedChange={(checked) => setFormValues({...formValues, file_cataloging: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex flex-col">
                        <Label htmlFor="file_contents_cataloging" className="mb-1.5">Content Cataloging</Label>
                        <span className="text-xs text-gray-500">Catalog file contents</span>
                      </div>
                      <Switch
                        id="file_contents_cataloging"
                        checked={formValues.file_contents_cataloging}
                        onCheckedChange={(checked) => setFormValues({...formValues, file_contents_cataloging: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Performance Options</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="performance_profile">Performance Profile</Label>
                        <Badge className="capitalize">{formValues.performance_profile}</Badge>
                      </div>
                      <Select 
                        value={formValues.performance_profile}
                        onValueChange={(value) => setFormValues({...formValues, performance_profile: value})}
                      >
                        <SelectTrigger id="performance_profile">
                          <SelectValue placeholder="Select profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">Fast (Less accurate)</SelectItem>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="deep">Deep (Most accurate)</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label htmlFor="parallelism">Parallelism: {formValues.parallelism} workers</Label>
                      </div>
                      <Slider
                        id="parallelism"
                        min={1}
                        max={16}
                        step={1}
                        value={[formValues.parallelism]}
                        onValueChange={(values) => setFormValues({...formValues, parallelism: values[0]})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label htmlFor="exclude_patterns">Exclude Patterns</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Glob patterns to exclude files or directories from scanning.
                            Examples: "**/*.tmp", "**/node_modules/**"
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      id="exclude_patterns"
                      value={newExcludePattern}
                      onChange={(e) => setNewExcludePattern(e.target.value)}
                      placeholder="e.g., **/node_modules/**"
                    />
                    <Button 
                      variant="outline" 
                      onClick={addExcludePattern}
                    >
                      Add
                    </Button>
                  </div>
                  {formValues.exclude_patterns && formValues.exclude_patterns.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formValues.exclude_patterns.map((pattern, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {pattern}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => removeExcludePattern(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ci_integration" className="text-sm font-medium">CI/CD Integration</Label>
                    <Switch
                      id="ci_integration"
                      checked={formValues.ci_integration.enabled}
                      onCheckedChange={(checked) => setFormValues({
                        ...formValues, 
                        ci_integration: {
                          ...formValues.ci_integration,
                          enabled: checked
                        }
                      })}
                    />
                  </div>

                  {formValues.ci_integration.enabled && (
                    <div className="pl-4 border-l-2 border-gray-200 space-y-4 mt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fail_on_severity">Fail Pipeline On Severity</Label>
                        <Select 
                          value={formValues.ci_integration.fail_on_severity}
                          onValueChange={(value) => setFormValues({
                            ...formValues, 
                            ci_integration: {
                              ...formValues.ci_integration,
                              fail_on_severity: value
                            }
                          })}
                        >
                          <SelectTrigger id="fail_on_severity">
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical Only</SelectItem>
                            <SelectItem value="high">High and Above</SelectItem>
                            <SelectItem value="medium">Medium and Above</SelectItem>
                            <SelectItem value="low">Low and Above</SelectItem>
                            <SelectItem value="none">Never Fail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="summary_file">Summary Report Path</Label>
                        <Input 
                          id="summary_file"
                          value={formValues.ci_integration.summary_file}
                          onChange={(e) => setFormValues({
                            ...formValues, 
                            ci_integration: {
                              ...formValues.ci_integration,
                              summary_file: e.target.value
                            }
                          })}
                          placeholder="Path for summary report"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={cancelEdit}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={isCreating ? handleCreate : handleUpdate}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!formValues.name || !formValues.source_path}
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? "Create Configuration" : "Update Configuration"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}