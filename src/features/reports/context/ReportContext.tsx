import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface PDFContextType {
  selectedRows: number[];
  isGenerating: boolean;
  showPreview: boolean;
  selectRow: (index: number) => void;
  selectAllRows: (indices: number[]) => void;
  clearSelection: () => void;
  setIsGenerating: (value: boolean) => void;
  setShowPreview: (value: boolean) => void;
  togglePreview: () => void;
}

const PDFContext = createContext<PDFContextType | null>(null);

export function PDFProvider({ children }: { children: ReactNode }) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const selectRow = useCallback((index: number) => {
    setSelectedRows((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  }, []);

  const selectAllRows = useCallback((indices: number[]) => {
    setSelectedRows(indices);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
  }, []);

  const value: PDFContextType = {
    selectedRows,
    isGenerating,
    showPreview,
    selectRow,
    selectAllRows,
    clearSelection,
    setIsGenerating,
    setShowPreview,
    togglePreview,
  };

  return <PDFContext.Provider value={value}>{children}</PDFContext.Provider>;
}

export function usePDF() {
  const context = useContext(PDFContext);
  if (!context) {
    throw new Error('usePDF deve ser usado dentro de um PDFProvider');
  }
  return context;
}

export default PDFContext;
