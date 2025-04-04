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

export default function CompatibilityTable({ items, compatibilityData }) {
  const getCompatibilityStatus = (component) => {
    const matchingData = compatibilityData.find(
      data => data.package_name.toLowerCase() === component.name.toLowerCase()
    );

    if (!matchingData) return 'unknown';

    if (matchingData.version_pattern.includes('>=')) {
      const minVersion = matchingData.version_pattern.replace('>=', '');
      return component.version >= minVersion ? 'compatible' : 'not_compatible';
    }

    if (matchingData.version_pattern.includes('all')) return 'compatible';
    if (matchingData.version_pattern.includes('none')) return 'not_compatible';
    if (matchingData.version_pattern.includes('partial')) return 'partial';

    return matchingData.version_pattern === component.version ? 'compatible' : 'not_compatible';
  };

  return (
    <div className="rounded-md border dark:border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="dark:hover:bg-gray-800">
            <TableHead>Component Name</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Compatibility</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const status = getCompatibilityStatus(item);
            const matchingData = compatibilityData.find(
              data => data.package_name.toLowerCase() === item.name.toLowerCase()
            );

            return (
              <TableRow 
                key={`${item.name}-${index}`}
                className="dark:hover:bg-gray-800 dark:text-gray-300"
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
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}