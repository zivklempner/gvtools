import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
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

export default function CompatibilityBadge({ status, notes, version }) {
  const renderStatusBadge = () => {
    switch (status) {
      case 'compatible':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Compatible
          </Badge>
        );
      case 'not_compatible':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Not Compatible
          </Badge>
        );
      case 'partial':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Partial
          </Badge>
        );
      case 'unknown':
      default:
        return (
          <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Unknown
          </Badge>
        );
    }
  };

  const getVersionDisplay = () => {
    if (!version) return null;
    
    if (version.includes('all')) {
      return 'All versions';
    }
    
    if (version.includes('none')) {
      return 'No versions';
    }
    
    if (version.includes('partial')) {
      return 'Some versions';
    }
    
    return version;
  };

  const versionDisplay = getVersionDisplay();

  return (
    <div className="flex items-center gap-2">
      {renderStatusBadge()}
      {versionDisplay && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-gray-500 cursor-help">
                ({versionDisplay})
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Compatible version pattern: {version}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}