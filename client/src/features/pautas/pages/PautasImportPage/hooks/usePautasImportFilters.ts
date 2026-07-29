import { useState, useEffect, useMemo } from 'react';

interface UsePautasImportFiltersProps {
  ocrFiles: any[];
  isLoadingPautas: boolean;
  queryDataUf?: string;
}

export function usePautasImportFilters({
  ocrFiles,
  isLoadingPautas,
  queryDataUf,
}: UsePautasImportFiltersProps) {
  const [contexto, setContexto] = useState<'proprio' | 'terceiros'>(() => {
    return (sessionStorage.getItem('pautas_import_contexto') as 'proprio' | 'terceiros') || 'proprio';
  });

  const [auditFilename, setAuditFilename] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_filename') || '';
  });

  const [vigenciaDate, setVigenciaDate] = useState<string>('');

  const [filterMonth, setFilterMonth] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_month') || 'all';
  });

  const [filterYear, setFilterYear] = useState<string>(() => {
    return sessionStorage.getItem('pautas_import_year') || 'all';
  });

  const [mode, setMode] = useState<'select' | 'upload'>(() => {
    return (sessionStorage.getItem('pautas_import_mode') as 'select' | 'upload') || 'select';
  });

  // Persistência em sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pautas_import_contexto', contexto);
  }, [contexto]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_filename', auditFilename);
  }, [auditFilename]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_month', filterMonth);
  }, [filterMonth]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_year', filterYear);
  }, [filterYear]);

  useEffect(() => {
    sessionStorage.setItem('pautas_import_mode', mode);
  }, [mode]);

  // Se não houver arquivos no banco, inicia no modo de upload automaticamente
  useEffect(() => {
    if (!isLoadingPautas && ocrFiles.length === 0) {
      setMode('upload');
    }
  }, [isLoadingPautas, ocrFiles.length]);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        ocrFiles
          .map((f: any) => {
            if (!f.data_pauta) return '';
            const datePart = typeof f.data_pauta === 'string' ? f.data_pauta.split('T')[0] : '';
            return datePart ? datePart.split('-')[0] : '';
          })
          .filter((year: string) => year !== '')
      )
    ).sort((a: any, b: any) => b.localeCompare(a));
  }, [ocrFiles]);

  const filteredOcrFiles = useMemo(() => {
    return ocrFiles.filter((file: any) => {
      if (!file.data_pauta) return filterMonth === 'all' && filterYear === 'all';
      const datePart = typeof file.data_pauta === 'string' ? file.data_pauta.split('T')[0] : '';
      if (!datePart) return false;
      const [year, month] = datePart.split('-');

      const matchMonth = filterMonth === 'all' || month === filterMonth;
      const matchYear = filterYear === 'all' || year === filterYear;
      return matchMonth && matchYear;
    });
  }, [ocrFiles, filterMonth, filterYear]);

  const selectedAuditFile = useMemo(() => {
    return ocrFiles.find((f: any) => f.filename === auditFilename);
  }, [ocrFiles, auditFilename]);

  const selectedAuditUf = queryDataUf || (selectedAuditFile ? selectedAuditFile.uf : '');

  // Preenche a data de vigência com a data cadastrada no banco, ou limpa se não houver
  useEffect(() => {
    if (auditFilename) {
      const selectedFileObj = ocrFiles.find((f: any) => f.filename === auditFilename);
      if (selectedFileObj && selectedFileObj.data_pauta) {
        const datePart =
          typeof selectedFileObj.data_pauta === 'string'
            ? selectedFileObj.data_pauta.split('T')[0]
            : '';
        setVigenciaDate(datePart);
      } else {
        setVigenciaDate('');
      }
    } else {
      setVigenciaDate('');
    }
  }, [auditFilename, ocrFiles]);

  return {
    contexto,
    setContexto,
    auditFilename,
    setAuditFilename,
    vigenciaDate,
    setVigenciaDate,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    mode,
    setMode,
    availableYears,
    filteredOcrFiles,
    selectedAuditUf,
  };
}
