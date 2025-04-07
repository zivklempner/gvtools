
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CompatibilityBadge from './CompatibilityBadge';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ExternalLink } from 'lucide-react';

export default function CompatibilityTable({ items, compatibilityData }) {
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const compareVersions = (version1, version2) => {
    // Handle cases where version might be undefined
    if (!version1 || !version2) return false;
    
    // Split versions into parts
    const v1parts = version1.split('.');
    const v2parts = version2.split('.');
    
    // Make sure we have equal number of parts by padding with zeros
    while (v1parts.length < v2parts.length) v1parts.push('0');
    while (v2parts.length < v2parts.length) v2parts.push('0');
    
    // Compare each part
    for (let i = 0; i < v1parts.length; ++i) {
      const v1 = parseInt(v1parts[i]) || 0;
      const v2 = parseInt(v2parts[i]) || 0;
      
      if (v1 > v2) return true;      // version1 is higher
      if (v1 < v2) return false;     // version1 is lower
    }
    
    return true;  // Versions are equal
  };

  const getCompatibilityStatus = (component) => {
    const matchingData = compatibilityData.find(
      data => data.package_name.toLowerCase() === component.name.toLowerCase()
    );

    if (!matchingData) return 'unknown';

    if (matchingData.version_pattern.includes('>=')) {
      const minVersion = matchingData.version_pattern.replace('>=', '');
      return compareVersions(component.version, minVersion) ? 'compatible' : 'not_compatible';
    }

    if (matchingData.version_pattern.includes('all')) return 'compatible';
    if (matchingData.version_pattern.includes('none')) return 'not_compatible';
    if (matchingData.version_pattern.includes('partial')) return 'partial';

    // For exact version matches
    return matchingData.version_pattern === component.version ? 'compatible' : 'not_compatible';
  };

  const paginatedItems = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div>
      <div className="rounded-md border dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="dark:hover:bg-gray-800">
              <TableHead>Component Name</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Compatibility</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item, index) => {
              const status = getCompatibilityStatus(item);
              const matchingData = compatibilityData.find(
                data => data.package_name.toLowerCase() === item.name.toLowerCase()
              );

              return (
                <TableRow 
                  key={`${item.name}-${index}`}
                  className="dark:hover:bg-gray-800/70 dark:text-gray-300 hover-highlight"
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.version}</TableCell>
                  <TableCell className="capitalize">
                    {item.type?.replace('_', ' ') || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <CompatibilityBadge 
                      status={status} 
                      notes={matchingData?.notes}
                      version={matchingData?.version_pattern}
                    />
                  </TableCell>
                  <TableCell>
                    {matchingData?.source && (
                      <a 
                        href={matchingData.source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Documentation
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
