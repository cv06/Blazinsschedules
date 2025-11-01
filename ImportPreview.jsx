import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ImportPreview({ data, onConfirm, onCancel, isProcessing }) {
  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Preview Import Data ({data.length} appointments)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="max-h-96 overflow-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{appointment.title}</TableCell>
                  <TableCell>{appointment.client_name || '-'}</TableCell>
                  <TableCell>
                    {appointment.start_datetime ? 
                      format(new Date(appointment.start_datetime), 'MMM d, yyyy') : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {appointment.start_datetime ? 
                      format(new Date(appointment.start_datetime), 'h:mm a') : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{appointment.status || 'scheduled'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {data.length > 10 && (
            <div className="text-center py-4 text-slate-500">
              ... and {data.length - 10} more appointments
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Confirm Import
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}