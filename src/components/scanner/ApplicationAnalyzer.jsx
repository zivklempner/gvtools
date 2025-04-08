
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  MessageSquare, 
  Search, 
  Container, 
  GitBranch, 
  Package,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ApplicationAnalyzer({ applications }) {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'message_queue':
        return <MessageSquare className="h-4 w-4" />;
      case 'search_engine':
        return <Search className="h-4 w-4" />;
      case 'container_orchestration':
        return <Container className="h-4 w-4" />;
      case 'ci_cd':
        return <GitBranch className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'compatible':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Compatible
          </Badge>
        );
      case 'not_compatible':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Not Compatible
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <HelpCircle className="h-3 w-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  // Group applications by category
  const groupedApps = applications.reduce((acc, app) => {
    const category = app.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(app);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedApps).map(([category, apps]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getCategoryIcon(category)}
              {category.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {apps.map((app, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Server className="h-8 w-8 text-gray-500" />
                    <div>
                      <h4 className="font-medium">{app.application_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{app.version}</Badge>
                        {getStatusBadge(app.graviton_compatibility_status)}
                      </div>
                    </div>
                  </div>
                  
                  {app.compatibility_notes && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{app.compatibility_notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
