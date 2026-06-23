import React, { useMemo } from 'react';
import { MoreHorizontal, Edit, Trash, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import TableComponent from '@/components/Table';
import { type ColumnDef } from '@tanstack/react-table';
import { calculateColumnSizes } from '@/shared/utils/table';

interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  active: boolean;
}

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  loading: boolean;
  onDelete: (user: User) => void;
  isAdmin?: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDelete, loading, isAdmin = false }) => {
  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [];

    if (isAdmin) {
      cols.push({
        id: 'actions',
        header: 'Ações',
        size: 100,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Abrir ações"
                className="h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDelete(row.original)}
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      });
    }

    cols.push(
      {
        accessorKey: 'name',
        header: 'Nome Completo',
        size: 200,
        cell: ({ row }) => (
          <Button
            variant="link"
            className="px-0 h-auto font-medium text-foreground hover:text-primary transition-colors text-left hover:no-underline"
            onClick={() => onEdit(row.original)}
          >
            {row.original.name}
          </Button>
        ),
      },
      {
        accessorKey: 'email',
        header: 'E-mail',
        size: 220,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Perfil de Acesso',
        size: 160,
        cell: ({ row }) =>
          row.original.role === 'admin' ? (
            <Badge variant="outline" className="gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold px-2 py-0.5">
              <Shield className="w-3 h-3" /> Administrador
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400 font-semibold px-2 py-0.5">
              <User className="w-3 h-3" /> Usuário Comum
            </Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5">
              Ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold px-2 py-0.5">
              Inativo
            </Badge>
          ),
      }
    );

    return calculateColumnSizes(cols, users);
  }, [isAdmin, onEdit, onDelete, users]);

  if (loading && users.length === 0) {
    return (
      <div className="h-48 text-center flex flex-col items-center justify-center gap-2 border rounded-lg bg-sidebar/20 shadow-xs">
        <Spinner className="w-8 h-8" />
        <span className="text-sm text-muted-foreground">Carregando usuários...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="overflow-hidden rounded-lg border border-border dark:border-white/15 bg-card shadow-xs flex-1 min-h-0 flex flex-col">
        <TableComponent
          tableId="users"
          columns={columns}
          data={users}
          isLoading={loading}
          paginate
          defaultPageSize={20}
          maxHeight="550px"
        />
      </div>
    </div>
  );
};
