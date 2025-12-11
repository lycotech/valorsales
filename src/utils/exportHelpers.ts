/**
 * Export Utilities - CSV, Excel, and PDF export helpers
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

// ============================================
// CSV EXPORT
// ============================================

interface CSVOptions {
  filename: string
  headers?: string[]
  delimiter?: string
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(data: T[], options: CSVOptions): void {
  const { filename, headers, delimiter = ',' } = options

  if (data.length === 0) {
    console.warn('No data to export')

    return
  }

  // Use provided headers or extract from first object
  const columnHeaders = headers || Object.keys(data[0])

  // Build CSV content
  const csvContent = [
    // Header row
    columnHeaders.join(delimiter),
    // Data rows
    ...data.map(row =>
      columnHeaders
        .map(header => {
          const value = row[header]

          // Handle different value types
          if (value === null || value === undefined) return ''
          if (typeof value === 'string' && value.includes(delimiter)) {
            return `"${value.replace(/"/g, '""')}"`
          }
          if (value instanceof Date) {
            return value.toISOString()
          }

          return String(value)
        })
        .join(delimiter)
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })

  downloadBlob(blob, `${filename}.csv`)
}

/**
 * Export to CSV with formatted headers (converts camelCase to Title Case)
 */
export function exportToCSVFormatted<T extends Record<string, any>>(
  data: T[],
  options: {
    filename: string
    columnMap?: Record<string, string>
    excludeColumns?: string[]
  }
): void {
  const { filename, columnMap = {}, excludeColumns = [] } = options

  if (data.length === 0) return

  // Get columns, excluding specified ones
  const columns = Object.keys(data[0]).filter(col => !excludeColumns.includes(col))

  // Create formatted headers
  const headers = columns.map(col => columnMap[col] || formatHeader(col))

  // Transform data with formatted values
  const formattedData = data.map(row => {
    const newRow: Record<string, any> = {}

    columns.forEach((col, index) => {
      newRow[headers[index]] = row[col]
    })

    return newRow
  })

  exportToCSV(formattedData, { filename, headers })
}

/**
 * Convert camelCase to Title Case
 */
function formatHeader(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim()
}

// ============================================
// PDF EXPORT (Basic HTML to Print)
// ============================================

interface PDFOptions {
  title: string
  subtitle?: string
  orientation?: 'portrait' | 'landscape'
}

/**
 * Generate printable HTML for data export
 * Opens in new window for printing to PDF
 */
export function exportToPrintablePDF<T extends Record<string, any>>(
  data: T[],
  options: PDFOptions & {
    columns: { key: string; label: string; format?: (value: any) => string }[]
  }
): void {
  const { title, subtitle, orientation = 'portrait', columns } = options

  const tableRows = data.map(row =>
    columns
      .map(col => {
        const value = row[col.key]
        const formatted = col.format ? col.format(value) : String(value ?? '')

        return `<td>${formatted}</td>`
      })
      .join('')
  )

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { size: ${orientation}; margin: 1cm; }
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 18px; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => `<tr>${row}</tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">
        <p>ValorSales - Poultry Management System</p>
      </div>
      <script>
        window.onload = function() { window.print(); }
      </script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')

  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to JSON file
 */
export function exportToJSON<T>(data: T, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })

  downloadBlob(blob, `${filename}.json`)
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvString: string, options: { hasHeaders?: boolean; delimiter?: string } = {}): any[] {
  const { hasHeaders = true, delimiter = ',' } = options
  const lines = csvString.trim().split('\n')

  if (lines.length === 0) return []

  const headers = hasHeaders ? lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '')) : []

  const startIndex = hasHeaders ? 1 : 0
  const result: any[] = []

  for (let i = startIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter)

    if (hasHeaders) {
      const obj: Record<string, string> = {}

      headers.forEach((header, index) => {
        obj[header] = values[index] || ''
      })
      result.push(obj)
    } else {
      result.push(values)
    }
  }

  return result
}

/**
 * Parse a single CSV line (handles quoted values)
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())

  return result
}

// ============================================
// EXCEL EXPORT (using xlsx)
// ============================================

interface ExcelColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => any
}

interface ExcelExportOptions {
  filename: string
  sheetName?: string
  columns: ExcelColumn[]
  title?: string
  subtitle?: string
}

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends Record<string, any>>(data: T[], options: ExcelExportOptions): void {
  const { filename, sheetName = 'Sheet1', columns, title, subtitle } = options

  // Prepare worksheet data
  const wsData: any[][] = []

  // Add title and subtitle if provided
  if (title) {
    wsData.push([title])
    wsData.push([])
  }

  if (subtitle) {
    wsData.push([subtitle])
    wsData.push([])
  }

  // Add header row
  wsData.push(columns.map(col => col.label))

  // Add data rows
  data.forEach(row => {
    const rowData = columns.map(col => {
      const value = row[col.key]

      if (col.format) {
        return col.format(value)
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }

      return value ?? ''
    })

    wsData.push(rowData)
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }))

  ws['!cols'] = colWidths

  // Merge title cells if title exists
  if (title) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }]
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate and download file
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/**
 * Export multiple sheets to Excel
 */
export function exportToExcelMultiSheet(
  sheets: Array<{
    name: string
    data: any[]
    columns: ExcelColumn[]
  }>,
  filename: string
): void {
  const wb = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    const wsData: any[][] = []

    // Add header row
    wsData.push(sheet.columns.map(col => col.label))

    // Add data rows
    sheet.data.forEach(row => {
      const rowData = sheet.columns.map(col => {
        const value = row[col.key]

        if (col.format) {
          return col.format(value)
        }

        return value ?? ''
      })

      wsData.push(rowData)
    })

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws['!cols'] = sheet.columns.map(col => ({ wch: col.width || 15 }))
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })

  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ============================================
// PDF EXPORT (using jsPDF + autoTable)
// ============================================

interface PDFColumn {
  key: string
  label: string
  width?: number
  format?: (value: any) => string
  align?: 'left' | 'center' | 'right'
}

interface PDFExportOptions {
  filename: string
  title: string
  subtitle?: string
  orientation?: 'portrait' | 'landscape'
  columns: PDFColumn[]
  footer?: string
  showDate?: boolean
  showPageNumbers?: boolean
}

/**
 * Export data to PDF file using jsPDF
 */
export function exportToPDF<T extends Record<string, any>>(data: T[], options: PDFExportOptions): void {
  const {
    filename,
    title,
    subtitle,
    orientation = 'portrait',
    columns,
    footer = 'ValorSales - Poultry Management System',
    showDate = true,
    showPageNumbers = true
  } = options

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Add title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
  }

  // Add date
  if (showDate) {
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' })
    doc.setTextColor(0)
    yPos += 8
  }

  // Prepare table data
  const tableHeaders = columns.map(col => col.label)
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key]

      if (col.format) {
        return col.format(value)
      }

      if (value === null || value === undefined) {
        return ''
      }

      if (value instanceof Date) {
        return value.toLocaleDateString()
      }

      return String(value)
    })
  )

  // Add table using autoTable
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: yPos,
    theme: 'striped',
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: columns.reduce(
      (acc, col, index) => {
        if (col.align) {
          acc[index] = { halign: col.align }
        }

        return acc
      },
      {} as Record<number, { halign: 'left' | 'center' | 'right' }>
    ),
    margin: { top: 10, left: 10, right: 10, bottom: 20 },
    didDrawPage: function (hookData) {
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = hookData.pageNumber

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128)

      if (footer) {
        doc.text(footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
          align: 'center'
        })
      }

      if (showPageNumbers) {
        doc.text(`Page ${currentPage} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, {
          align: 'right'
        })
      }
    }
  })

  // Save PDF
  doc.save(`${filename}.pdf`)
}

/**
 * Export summary/report PDF with sections
 */
export function exportReportToPDF(options: {
  filename: string
  title: string
  subtitle?: string
  orientation?: 'portrait' | 'landscape'
  sections: Array<{
    title: string
    type: 'table' | 'summary' | 'text'
    data?: any[]
    columns?: PDFColumn[]
    content?: string
    summaryItems?: Array<{ label: string; value: string | number }>
  }>
}): void {
  const { filename, title, subtitle, orientation = 'portrait', sections } = options

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 15

  // Add title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // Add subtitle
  if (subtitle) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center' })
    yPos += 6
  }

  // Add date
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' })
  doc.setTextColor(0)
  yPos += 12

  // Process sections
  sections.forEach((section, sectionIndex) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      yPos = 15
    }

    // Section title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(section.title, 10, yPos)
    yPos += 6

    if (section.type === 'summary' && section.summaryItems) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      section.summaryItems.forEach(item => {
        doc.text(`${item.label}: ${item.value}`, 15, yPos)
        yPos += 5
      })

      yPos += 5
    } else if (section.type === 'text' && section.content) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(section.content, pageWidth - 20)

      doc.text(lines, 10, yPos)
      yPos += lines.length * 5 + 5
    } else if (section.type === 'table' && section.data && section.columns) {
      const tableHeaders = section.columns.map(col => col.label)
      const tableData = section.data.map(row =>
        section.columns!.map(col => {
          const value = row[col.key]

          if (col.format) return col.format(value)
          if (value === null || value === undefined) return ''

          return String(value)
        })
      )

      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        theme: 'striped',
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8
        },
        margin: { left: 10, right: 10 }
      })

      // Update yPos after table
      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Add spacing between sections
    if (sectionIndex < sections.length - 1) {
      yPos += 5
    }
  })

  // Add footer to all pages
  const pageCount = (doc as any).internal.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128)
    doc.text('ValorSales - Poultry Management System', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, {
      align: 'center'
    })
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, doc.internal.pageSize.getHeight() - 10, {
      align: 'right'
    })
  }

  doc.save(`${filename}.pdf`)
}

// ============================================
// PRINT FUNCTIONALITY
// ============================================

/**
 * Open print dialog for current page
 */
export function printPage(): void {
  window.print()
}

/**
 * Print specific element by ID
 */
export function printElement(elementId: string, title?: string): void {
  const element = document.getElementById(elementId)

  if (!element) {
    console.error(`Element with ID "${elementId}" not found`)

    return
  }

  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    console.error('Failed to open print window')

    return
  }

  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title || 'Print'}</title>
      <style>
        ${styles}
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        }
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}
