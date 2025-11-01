import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";

export default function ExportOptions({ appointmentCount, onExport }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Export to Excel</h3>
        <p className="text-slate-600 mb-4">
          Download all your appointment data as an Excel spreadsheet
        </p>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{appointmentCount}</div>
          <div className="text-sm text-slate-600">Total appointments to export</div>
        </div>
      </div>

      <Button
        onClick={onExport}
        disabled={appointmentCount === 0}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Download className="w-4 h-4 mr-2" />
        Export to Excel
      </Button>

      <div className="text-xs text-slate-500 text-center">
        The exported file will include all appointment details and can be opened in Excel, Google Sheets, or any spreadsheet application.
      </div>
    </div>
  );
}