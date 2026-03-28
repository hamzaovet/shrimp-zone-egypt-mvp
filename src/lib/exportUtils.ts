import * as XLSX from 'xlsx';

/**
 * Reusable utility to export data to a true Excel (.xlsx) file using SheetJS.
 * This solves regional delimiter issues and preserves Arabic encoding perfectly.
 * @param data - Array of arrays (rows) to export.
 * @param headers - Array of strings for the first row.
 * @param filename - Desired name for the exported file (without extension).
 */
export const exportToExcel = (data: any[][], headers: string[], filename: string) => {
  if (!data) return;

  // Combine headers and data
  const worksheetData = [headers, ...data];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Premium feature: Set column widths for a comfortable look (wch is width in characters)
  const colWidths = headers.map(() => ({ wch: 25 }));
  ws['!cols'] = colWidths;

  // Append the sheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Bahij Report");

  // Trigger browser download
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
};
