import React from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia,
  EmptyContent
} from '@/components/ui/empty';

interface ClientsEmptyStateProps {
  onNewClient: () => void;
}

export const ClientsEmptyState: React.FC<ClientsEmptyStateProps> = ({ onNewClient }) => {
  return (
    <Empty className="mt-8 py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Building2 />
        </EmptyMedia>
        <EmptyTitle>Nenhum cliente encontrado</EmptyTitle>
        <EmptyDescription>
          Comece adicionando seu primeiro cliente para gerenciar suas faturas.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onNewClient} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </EmptyContent>
    </Empty>
  );
};


