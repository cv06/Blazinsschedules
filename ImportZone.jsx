import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";

export default function ImportZone({ onFileUpload, isProcessing }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="p-8">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Import Excel File</h3>
            <p className="text-slate-600 mb-4">
              Upload your Excel spreadsheet with appointment data
            </p>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </>
              )}
            </Button>
          </div>
          
          <div className="text-xs text-slate-500">
            Supported formats: .xlsx, .xls, .csv
          </div>
        </div>
      </div>
    </div>
  );
}