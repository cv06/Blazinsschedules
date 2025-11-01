import React, { useState, useEffect } from "react";
import { Appointment } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

import ImportZone from "../components/data/ImportZone";
import ExportOptions from "../components/data/ExportOptions";
import ImportPreview from "../components/data/ImportPreview";

export default function DataManager() {
  const [appointments, setAppointments] = useState([]);
  const [importData, setImportData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const data = await Appointment.list("-start_datetime");
    setAppointments(data);
  };

  const handleFileUpload = async (file) => {
    setIsProcessing(true);
    setMessage(null);

    try {
      const { file_url } = await UploadFile({ file });
      
      const result = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            appointments: {
              type: "array",
              items: Appointment.schema()
            }
          }
        }
      });

      if (result.status === "success" && result.output?.appointments) {
        setImportData(result.output.appointments);
        setMessage({
          type: "success",
          text: `Successfully parsed ${result.output.appointments.length} appointments from the file.`
        });
      } else {
        throw new Error("Could not extract appointment data from the file");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error processing file. Please ensure it contains appointment data in the correct format."
      });
    }

    setIsProcessing(false);
  };

  const handleImportConfirm = async () => {
    setIsProcessing(true);
    try {
      await Appointment.bulkCreate(importData);
      setMessage({
        type: "success",
        text: `Successfully imported ${importData.length} appointments.`
      });
      setImportData(null);
      loadAppointments();
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error importing appointments. Please try again."
      });
    }
    setIsProcessing(false);
  };

  const exportToExcel = () => {
    const exportData = appointments.map(apt => ({
      'Title': apt.title,
      'Client Name': apt.client_name,
      'Client Email': apt.client_email,
      'Client Phone': apt.client_phone,
      'Start Date': format(new Date(apt.start_datetime), 'yyyy-MM-dd'),
      'Start Time': format(new Date(apt.start_datetime), 'HH:mm'),
      'End Date': format(new Date(apt.end_datetime), 'yyyy-MM-dd'),
      'End Time': format(new Date(apt.end_datetime), 'HH:mm'),
      'Location': apt.location,
      'Status': apt.status,
      'Type': apt.appointment_type,
      'Priority': apt.priority,
      'Description': apt.description,
      'Notes': apt.notes
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => 
        JSON.stringify(row[header] || '')
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `appointments_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Import & Export Data</h1>
          <p className="text-slate-600">Manage your appointment data with Excel integration</p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ImportZone 
                onFileUpload={handleFileUpload}
                isProcessing={isProcessing}
              />
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Download className="w-5 h-5 text-green-600" />
                Export Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ExportOptions 
                appointmentCount={appointments.length}
                onExport={exportToExcel}
              />
            </CardContent>
          </Card>
        </div>

        {importData && (
          <ImportPreview 
            data={importData}
            onConfirm={handleImportConfirm}
            onCancel={() => setImportData(null)}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}