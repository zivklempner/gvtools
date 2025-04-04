import React, { useState } from 'react';
import { ImportedScan } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileUp, 
  AlertCircle, 
  CheckCircle, 
  Link as LinkIcon, 
  Trash2,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ImportedScansList({ imports, onViewScan, onReloadData }) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Imported
          </Badge>
        );
    }
  };

  const formatType = (format) => {
    // Convert format type to more readable format
    return format
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/([0-9]+\.[0-9]+)/, ' $1');
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      setIsDeleting(true);
      await ImportedScan.delete(deletingItem.id);
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      setIsDeleting(false);
      
      // Reload data after deletion
      if (onReloadData) {
        onReloadData();
      }
    } catch (error) {
      console.error("Error deleting imported scan:", error);
      setIsDeleting(false);
    }
  };

  if (!imports || imports.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Imported Syft Scans</CardTitle>
          <Link to={createPageUrl("Import")}>
            <Button variant="outline" size="sm">
              <FileUp className="h-4 w-4 mr-2" />
              Import New
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hostname</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Import Date</TableHead>
                <TableHead>Packages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.hostname}</TableCell>
                  <TableCell>{formatType(item.format)}</TableCell>
                  <TableCell>
                    {format(new Date(item.import_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {item.packages_count ? item.packages_count : 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {item.scan_result_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewScan(item.scan_result_id)}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingItem(item);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Delete Imported Scan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the imported scan for "{deletingItem?.hostname}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}