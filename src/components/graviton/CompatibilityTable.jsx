
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
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  FileText 
} from "lucide-react";
import CompatibilityBadge from './CompatibilityBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function CompatibilityTable({ items, compatibilityData }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No components to display.</p>
      </div>
    );
  }

  // Function to get compatibility status for a component
  const getCompatibilityStatus = (component) => {
    const matchingData = compatibilityData.find(
      data => data.package_name.toLowerCase() === component.name.toLowerCase()
    );
    
    if (!matchingData) {
      return {
        status: 'unknown',
        notes: null,
        version: null
      };
    }
    
    let status = 'unknown';
    
    if (matchingData.version_pattern.includes('>=')) {
      const minVersion = matchingData.version_pattern.replace('>=', '');
      status = component.version >= minVersion ? 'compatible' : 'not_compatible';
    } else if (matchingData.version_pattern.includes('all')) {
      status = 'compatible';
    } else if (matchingData.version_pattern.includes('none')) {
      status = 'not_compatible';
    } else if (matchingData.version_pattern.includes('partial')) {
      status = 'partial';
    } else {
      status = matchingData.version_pattern === component.version ? 'compatible' : 'not_compatible';
    }
    
    return {
      status,
      notes: matchingData.notes,
      version: matchingData.version_pattern
    };
  };

  // Categorize components by type for better organization
  const categorizedItems = items.reduce((acc, item) => {
    const category = item.type || 'unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(categorizedItems).map(([category, categoryItems]) => (
        <div key={category} className="mb-6">
          <h3 className="text-lg font-semibold mb-3 capitalize">
            {category.replace('_', ' ')}
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Graviton Compatibility</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryItems.map((item, index) => {
                const compatibility = getCompatibilityStatus(item);
                return (
                  <TableRow key={`${item.name}-${index}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.version || 'Unknown'}</TableCell>
                    <TableCell>
                      <CompatibilityBadge 
                        status={compatibility.status} 
                        notes={compatibility.notes}
                        version={compatibility.version}
                      />
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {compatibility.notes ? (
                        <div className="truncate">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {compatibility.notes.substring(0, 60)}
                                  {compatibility.notes.length > 60 ? '...' : ''}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-md">
                                <p>{compatibility.notes}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        compatibility.status === 'unknown' ? (
                          <span className="text-gray-400 italic">No information available</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
