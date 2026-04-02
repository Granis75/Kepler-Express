import { useState, useCallback, useRef } from 'react'
import { FileDown, FileText, AlertCircle } from 'lucide-react'
import { OperationData, ExportOptions } from '../types/operations'
import { exportToExcel, exportToPdf } from '../lib/export/exportUtils'
import toast from 'react-hot-toast'

interface ExportActionsProps {
  data: OperationData[]
  filename?: string
  startDate?: string
  endDate?: string
  disabled?: boolean
}

type ExportFormat = 'excel' | 'pdf' | null

/**
 * ExportActions Component
 * 
 * Premium minimal export component for operations data
 * - Excel export with XLSX (SheetJS)
 * - PDF export with @react-pdf/renderer
 * - Apple/Linear design aesthetic
 * - Double-click prevention
 * - Loading states
 */
export function ExportActions({
  data,
  filename = 'kepler-operations',
  startDate,
  endDate,
  disabled = false,
}: ExportActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeFormat, setActiveFormat] = useState<ExportFormat>(null)
  const lastClickRef = useRef<number>(0)

  // Prevent double-click exports
  const isClickThrottled = useCallback((): boolean => {
    const now = Date.now()
    if (now - lastClickRef.current < 500) {
      return true
    }
    lastClickRef.current = now
    return false
  }, [])

  // Handle Excel export
  const handleExcelExport = useCallback(async () => {
    if (isClickThrottled() || isLoading || disabled || data.length === 0) {
      return
    }

    setIsLoading(true)
    setActiveFormat('excel')

    try {
      const options: ExportOptions = {
        filename,
        data,
        startDate,
        endDate,
      }
      exportToExcel(options)
      toast.success(`${data.length} opérations exportées en Excel`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export Excel'
      toast.error(message)
      console.error('Excel export error:', error)
    } finally {
      setIsLoading(false)
      setActiveFormat(null)
    }
  }, [data, filename, startDate, endDate, disabled, isLoading, isClickThrottled])

  // Handle PDF export
  const handlePdfExport = useCallback(async () => {
    if (isClickThrottled() || isLoading || disabled || data.length === 0) {
      return
    }

    setIsLoading(true)
    setActiveFormat('pdf')

    try {
      const options: ExportOptions = {
        filename,
        data,
        startDate,
        endDate,
      }
      await exportToPdf(options)
      toast.success(`${data.length} opérations exportées en PDF`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'export PDF'
      toast.error(message)
      console.error('PDF export error:', error)
    } finally {
      setIsLoading(false)
      setActiveFormat(null)
    }
  }, [data, filename, startDate, endDate, disabled, isLoading, isClickThrottled])

  // Show empty state message
  const isEmpty = data.length === 0
  const isButtonDisabled = disabled || isEmpty || isLoading

  return (
    <div className="flex items-center gap-2">
      {isEmpty && !disabled && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
          <span className="text-xs text-amber-700 font-medium">Aucune donnée</span>
        </div>
      )}

      {/* Excel Export Button */}
      <button
        onClick={handleExcelExport}
        disabled={isButtonDisabled}
        aria-label="Exporter en Excel"
        title={isEmpty ? 'Aucune donnée à exporter' : 'Exporter les opérations en Excel'}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-lg
          font-medium text-sm transition-all duration-150
          ${
            isButtonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100'
          }
          ${activeFormat === 'excel' && isLoading ? 'opacity-75' : ''}
        `}
      >
        <FileDown
          size={16}
          className={`flex-shrink-0 ${activeFormat === 'excel' && isLoading ? 'animate-spin' : ''}`}
        />
        <span>Excel</span>
      </button>

      {/* PDF Export Button */}
      <button
        onClick={handlePdfExport}
        disabled={isButtonDisabled}
        aria-label="Exporter en PDF"
        title={isEmpty ? 'Aucune donnée à exporter' : 'Exporter les opérations en PDF'}
        className={`
          inline-flex items-center gap-2 px-3.5 py-2 rounded-lg
          font-medium text-sm transition-all duration-150
          ${
            isButtonDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100'
          }
          ${activeFormat === 'pdf' && isLoading ? 'opacity-75' : ''}
        `}
      >
        <FileText
          size={16}
          className={`flex-shrink-0 ${activeFormat === 'pdf' && isLoading ? 'animate-spin' : ''}`}
        />
        <span>PDF</span>
      </button>
    </div>
  )
}

// Export type for TypeScript consumers
export type { ExportActionsProps }
