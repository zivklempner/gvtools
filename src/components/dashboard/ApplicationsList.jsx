import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  MessageSquare,
  Search,
  Server,
  GitBranch,
  Box,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ApplicationsList({ applications }) {
  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No applications detected
      </div>
    );
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'message_queue':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'search_engine':
        return <Search className="h-4 w-4 text-purple-500" />;
      case 'container_orchestration':
        return <Box className="h-4 w-4 text-cyan-500" />;
      case 'ci_cd':
        return <GitBranch className="h-4 w-4 text-amber-500" />;
      default:
        return <Server className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCompatibilityBadge = (status) => {
    switch (status) {
      case 'compatible':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Compatible
          </Badge>
        );
      case 'not_compatible':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Not Compatible
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Partial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <HelpCircle className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-md border dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Detection Method</TableHead>
            <TableHead>Graviton Compatibility</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app, index) => (
            <TableRow key={index} className="hover-highlight">
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(app.category)}
                  <span>{app.application_name}</span>
                </div>
              </TableCell>
              <TableCell>{app.version || '—'}</TableCell>
              <TableCell className="capitalize">
                {app.detection_method?.replace('_', ' ')}
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {getCompatibilityBadge(app.graviton_compatibility_status)}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{app.compatibility_notes || 'No additional information available'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}