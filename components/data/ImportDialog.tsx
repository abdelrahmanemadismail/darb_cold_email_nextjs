'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert } from '@/components/ui/alert';
import axios from 'axios';
import { toast } from 'sonner';

// Type for CSV row data where keys are column names and values are strings
type CSVRow = Record<string, string>;

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportDialog({ open, onOpenChange, onImportComplete }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    companiesCreated: number;
    contactsCreated: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setResults(null);
      parseCSVPreview(selectedFile);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const parseCSVPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));

      const previewData = lines.slice(1, 4).map(line => {
        const values = parseCSVLine(line);
        const obj: CSVRow = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });

      setPreview(previewData);
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]).map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj: CSVRow = {};
      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });
      return obj;
    }).filter(obj => obj['Email'] || obj['email']); // Filter out empty rows
  };

  // Map various CSV column formats to expected format
  const mapColumnNames = (row: CSVRow): CSVRow => {
    const mapped: CSVRow = {};
    
    // Name mappings
    mapped['First Name'] = row['First Name'] || row['first_name'] || row['firstName'] || '';
    mapped['Last name'] = row['Last name'] || row['last_name'] || row['lastName'] || '';
    
    // Contact info
    mapped['Email'] = row['Email'] || row['email'] || '';
    mapped['Mobile'] = row['Mobile'] || row['mobile'] || row['phone'] || '';
    mapped['Position'] = row['Position'] || row['position'] || row['title'] || '';
    mapped['Linkedin'] = row['Linkedin'] || row['linkedinUrl'] || row['linkedin_url'] || '';
    
    // Company info
    mapped['Company'] = row['Company'] || row['organizationName'] || row['company'] || row['organization'] || '';
    mapped['Company size'] = row['Company size'] || row['organizationSize'] || row['company_size'] || '';
    mapped['Company keyord'] = row['Company keyord'] || row['organizationSpecialities'] || row['keywords'] || row['specialities'] || '';
    
    // Location - prefer organization location over person location
    mapped['City'] = row['City'] || row['organizationCity'] || row['city'] || '';
    mapped['Country'] = row['Country'] || row['organizationCountry'] || row['country'] || '';
    
    // Other fields
    mapped['Gender'] = row['Gender'] || row['gender'] || '';
    mapped['Tags'] = row['Tags'] || row['tags'] || row['seniority'] || '';
    mapped['Email Stutse'] = row['Email Stutse'] || row['emailStatus'] || row['email_status'] || '';
    
    return mapped;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const data = parseCSV(text);

          console.log('Parsed CSV data:', data.length, 'rows');
          console.log('First row keys:', Object.keys(data[0] || {}));
          console.log('Sample row:', data[0]);

          // Map column names to expected format
          const mappedData = data.map(mapColumnNames);
          console.log('Mapped data sample:', mappedData[0]);

          const response = await axios.post('/api/data/import', { data: mappedData });

          setResults(response.data.results);

          if (response.data.results.success > 0) {
            toast.success(
              `Successfully imported ${response.data.results.contactsCreated} contacts and ${response.data.results.companiesCreated} companies`
            );
            onImportComplete();
          }

          if (response.data.results.failed > 0) {
            toast.warning(`${response.data.results.failed} rows failed to import`);
          }
        } catch (error) {
          console.error('Import error:', error);
          if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.error || 'Failed to import data';
            const errorDetails = error.response?.data?.details;
            toast.error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
          } else {
            toast.error('Failed to import data');
          }
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('File read error:', error);
      toast.error('Failed to read file');
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setResults(null);
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const template = `First Name,Last name,Company,Position,Email,Mobile,Linkedin,Email Stutse,Company size,Company keyord,Country,City,Gender,Tags
John,Smith,Acme Corporation,Software Engineer,john.smith@acme.com,+1-555-0101,https://linkedin.com/in/johnsmith,Verified,500-1000,"SaaS,B2B,Software",USA,San Francisco,Male,"Developer,Lead"`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts & Companies</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import contacts and companies into your database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Need a template?</p>
                <p className="text-xs text-muted-foreground">Download the CSV template to get started</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload CSV File</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {file && (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && !results && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview (first 3 rows)</p>
              <div className="text-xs text-muted-foreground mb-2">
                Detected columns: {Object.keys(preview[0] || {}).join(', ')}
              </div>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Company</th>
                      <th className="px-3 py-2 text-left">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{row['First Name']} {row['Last name']}</td>
                        <td className="px-3 py-2">{row['Email']}</td>
                        <td className="px-3 py-2">{row['Company']}</td>
                        <td className="px-3 py-2">{row['Position']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <div className="ml-2">
                  <h4 className="font-medium">Import Complete</h4>
                  <div className="mt-2 text-sm space-y-1">
                    <p>✅ Successfully imported: {results.success} contacts</p>
                    <p>🏢 Companies created: {results.companiesCreated}</p>
                    <p>👥 Contacts created: {results.contactsCreated}</p>
                    {results.failed > 0 && (
                      <p className="text-red-600">❌ Failed: {results.failed}</p>
                    )}
                  </div>
                </div>
              </Alert>

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">Errors:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600 flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              {results ? 'Close' : 'Cancel'}
            </Button>
            {!results && (
              <Button
                onClick={handleImport}
                disabled={!file || importing}
              >
                {importing ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
