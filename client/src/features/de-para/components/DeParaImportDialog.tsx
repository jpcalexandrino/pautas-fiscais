import { ImportSpreadsheetDialog } from '@/shared/components/ImportSpreadsheetDialog';

interface DeParaImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (file: File) => Promise<any>;
}

const TEMPLATE_ROWS = [
  {
    'UF': 'SP',
    'Termo na Pauta': 'CERVEJA IMPERIO PILSEN LN 355ML',
    'GTIN na Pauta': '7898585910014',
    'Código ERP Produto': '12345',
    'GTIN do Produto': '7898585910014',
    'Nome do Produto': 'CERVEJA IMPERIO PILSEN LN 355ML',
  },
  {
    'UF': 'RJ',
    'Termo na Pauta': 'CERVEJA IMPERIO LATA 269ML',
    'GTIN na Pauta': '',
    'Código ERP Produto': '54321',
    'GTIN do Produto': '',
    'Nome do Produto': '',
  },
];

export function DeParaImportDialog({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: DeParaImportDialogProps) {
  return (
    <ImportSpreadsheetDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onImport={onImportSuccess}
      title="Importar De-Para via Excel"
      description={
        <>
          Faça upload de uma planilha no formato <strong>.xlsx, .xls ou .csv</strong> para cadastrar ou atualizar múltiplos mapeamentos De-Para de uma vez.
        </>
      }
      templateRows={TEMPLATE_ROWS}
      templateSheetName="De-Para"
      templateFileName="modelo_importacao_depara.xlsx"
      successDetail="Todos os registros de De-Para foram importados sem erros."
      importErrorFallback="Falha ao importar registros de De-Para."
      instructions={
        <div className="text-xs text-muted-foreground p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 space-y-1.5">
          <p className="font-semibold text-amber-800 dark:text-amber-400">Instruções para o preenchimento:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>UF:</strong> Sigla do estado (Ex: SP, RJ, MG) com 2 letras.</li>
            <li><strong>Termo na Pauta:</strong> Descrição exata de como o produto aparece na pauta do estado.</li>
            <li><strong>GTIN na Pauta:</strong> EAN/Código de barras do produto na pauta (opcional).</li>
            <li>
              Para vincular ao produto interno correto, preencha <strong>ao menos um</strong> dos seguintes:{' '}
              <strong>Código ERP Produto</strong>, <strong>GTIN do Produto</strong> ou <strong>Nome do Produto</strong>.
            </li>
          </ul>
        </div>
      }
    />
  );
}
