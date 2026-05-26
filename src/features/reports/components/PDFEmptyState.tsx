import React from 'react';
import { LayoutPanelLeft, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia,
  EmptyContent
} from '@/components/ui/empty';

interface PDFEmptyStateProps {
  onBack: () => void;
}

export const PDFEmptyState: React.FC<PDFEmptyStateProps> = ({ onBack }) => {
  return (
    <Empty className="py-32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutPanelLeft />
        </EmptyMedia>
        <EmptyTitle>Nenhuma fatura selecionada</EmptyTitle>
        <EmptyDescription>
          Volte à tabela de dados e selecione as faturas para gerar o relatório consolidado.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Dados
        </Button>
      </EmptyContent>
    </Empty>
  );
};

