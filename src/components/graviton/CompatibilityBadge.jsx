import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompatibilityBadge({ status, notes }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'compatible':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
          label: 'Compatible',
          className: 'bg-green-100 text-green-800 border-green-200',
          tooltipText: notes || 'This component is compatible with AWS Graviton processors'
        };
      case 'not_compatible':
        return {
          icon: <XCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Not Compatible',
          className: 'bg-red-100 text-red-800 border-red-200',
          tooltipText: notes || 'This component is not compatible with AWS Graviton processors'
        };
      case 'partial':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Partial Support',
          className: 'bg-amber-100 text-amber-800 border-amber-200',
          tooltipText: notes || 'This component has partial or conditional compatibility with AWS Graviton'
        };
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 mr-1" />,
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
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