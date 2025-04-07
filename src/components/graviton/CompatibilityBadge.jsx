import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompatibilityBadge({ status, notes, version }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'compatible':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Compatible',
          className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
          tooltipText: `${notes || 'This component is compatible with AWS Graviton processors'}${version ? ` (Required: ${version})` : ''}`
        };
      case 'not_compatible':
        return {
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Not Compatible',
          className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
          tooltipText: `${notes || 'This component is not compatible with AWS Graviton processors'}${version ? ` (Required: ${version})` : ''}`
        };
      case 'partial':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Partial Support',
          className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
          tooltipText: `${notes || 'This component has partial or conditional compatibility with AWS Graviton'}${version ? ` (Required: ${version})` : ''}`
        };
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
          tooltipText: 'Compatibility status is unknown or not verified'
        };
    }
  };

  const { icon, label, className, tooltipText } = getStatusConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`flex items-center gap-1 ${className}`}>
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}