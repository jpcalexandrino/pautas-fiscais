import React from 'react';
import { Database, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent
} from '@/components/ui/empty';

interface DataEmptyStateProps {
  onNavigateToImport: () => void;
}

export const DataEmptyState: React.FC<DataEmptyStateProps> = ({ onNavigateToImport }) => {
  return (
    <Empty className="py-32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Database />
        </EmptyMedia>
        <EmptyTitle>Nenhum dado importado</EmptyTitle>
        <EmptyDescription>
          Faça upload de um arquivo CSV ou XLSX na seção de importação para começar sua análise.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onNavigateToImport} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Ir para Importação
        </Button>
      </EmptyContent>
    </Empty>
  );
};
