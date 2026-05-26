import React from 'react';
import { Cpu } from 'lucide-react';
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia 
} from '@/components/ui/empty';

export const EquipmentEmptyState: React.FC = () => {
  return (
    <Empty className="py-32">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Cpu />
        </EmptyMedia>
        <EmptyTitle>Nenhum cliente selecionado</EmptyTitle>
        <EmptyDescription>
          Selecione um cliente no menu superior para visualizar ou gerenciar seu levantamento de carga.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
