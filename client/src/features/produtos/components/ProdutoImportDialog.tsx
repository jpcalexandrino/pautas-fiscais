import { ImportSpreadsheetDialog } from '@/shared/components/ImportSpreadsheetDialog';

interface ProdutoImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (file: File) => Promise<any>;
}

const TEMPLATE_ROWS = [
  {
    'Descrição': 'PRODUTO EXEMPLO 100ML',
    'Código ERP': '12345',
    'GTIN': '7891234567890',
    'Embalagem': 'LATA',
    'Volume': 100,
    'Tipo': 'proprio',
  },
  {
    'Descrição': 'PRODUTO EXEMPLO 2 LITROS',
    'Código ERP': '54321',
    'GTIN': '7890987654321',
    'Embalagem': 'PET',
    'Volume': 2000,
    'Tipo': 'terceiros',
  },
];

export function ProdutoImportDialog({
  isOpen,
  onOpenChange,
  onImportSuccess,
}: ProdutoImportDialogProps) {
  return (
    <ImportSpreadsheetDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onImport={onImportSuccess}
      title="Importar Produtos via Excel"
      description={
        <>
          Faça upload de uma planilha no formato <strong>.xlsx, .xls ou .csv</strong> para cadastrar ou atualizar múltiplos produtos de uma vez.
        </>
      }
      templateRows={TEMPLATE_ROWS}
      templateSheetName="Produtos"
      templateFileName="modelo_importacao_produtos.xlsx"
      successDetail="Todos os produtos foram importados sem erros."
      importErrorFallback="Falha ao importar produtos."
    />
  );
}
