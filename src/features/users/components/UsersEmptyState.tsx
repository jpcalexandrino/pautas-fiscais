import React from 'react';
import { User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Empty, 
  EmptyHeader, 
  EmptyTitle, 
  EmptyDescription, 
  EmptyMedia,
  EmptyContent
} from '@/components/ui/empty';

interface UsersEmptyStateProps {
  onNewUser?: () => void;
}

export const UsersEmptyState: React.FC<UsersEmptyStateProps> = ({ onNewUser }) => {
  return (
    <Empty className="mt-8 py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <User />
        </EmptyMedia>
        <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
        <EmptyDescription>
          {onNewUser 
            ? "Comece adicionando seu primeiro usuário para gerenciar acessos ao sistema."
            : "Nenhum usuário foi cadastrado no sistema ainda."}
        </EmptyDescription>
      </EmptyHeader>
      {onNewUser && (
        <EmptyContent>
          <Button onClick={onNewUser} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};
