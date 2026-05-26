import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TableColumnFilter } from '@features/data/components/TableColumnFilter';
import { DataPagination } from '@features/data/components/DataPagination';
import { Spinner } from '@/components/ui/spinner';

interface UsersTableProps {
  users: any[];
  onEdit: (user: any) => void;
  loading: boolean;
  onDelete: (user: any) => void;
  isAdmin?: boolean;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDelete, loading, isAdmin = false }) => {
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSortChange = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  const filteredUsers = users
    .filter(user => {
      const nameMatch = (user.name || '').toLowerCase().includes(filters.name.toLowerCase());
      const emailMatch = (user.email || '').toLowerCase().includes(filters.email.toLowerCase());

      const roleStr = user.role === 'admin' ? 'administrador' : 'usuário comum';
      const roleMatch = roleStr.toLowerCase().includes(filters.role.toLowerCase());

      const statusStr = user.active !== false ? 'ativo' : 'inativo';
      const statusMatch = statusStr.toLowerCase().includes(filters.status.toLowerCase());

      return nameMatch && emailMatch && roleMatch && statusMatch;
    })
    .sort((a, b) => {
      if (!sortConfig.direction || !sortConfig.key) return 0;

      const multiplier = sortConfig.direction === 'asc' ? 1 : -1;
      const key = sortConfig.key;

      let valA = a[key] || '';
      let valB = b[key] || '';

      if (key === 'status') {
        valA = a.active !== false ? 'ativo' : 'inativo';
        valB = b.active !== false ? 'ativo' : 'inativo';
      }

      return String(valA).localeCompare(String(valB)) * multiplier;
    });

  // Reset to first page when filtering or data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers.length, filters]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {isAdmin && <TableHead className="w-12.5"></TableHead>}
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Nome"
                    value={filters.name}
                    onChange={(v) => handleFilterChange('name', v)}
                    sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('name', dir)}
                  >
                    Nome Completo
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="E-mail"
                    value={filters.email}
                    onChange={(v) => handleFilterChange('email', v)}
                    sortDirection={sortConfig.key === 'email' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('email', dir)}
                  >
                    E-mail
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Perfil"
                    value={filters.role}
                    onChange={(v) => handleFilterChange('role', v)}
                    sortDirection={sortConfig.key === 'role' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('role', dir)}
                  >
                    Perfil de Acesso
                  </TableColumnFilter>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <TableColumnFilter
                    columnName="Status"
                    value={filters.status}
                    onChange={(v) => handleFilterChange('status', v)}
                    sortDirection={sortConfig.key === 'status' ? sortConfig.direction : null}
                    onSort={(dir) => handleSortChange('status', dir)}
                  >
                    Status
                  </TableColumnFilter>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow key="loading-row">
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Spinner className="w-8 h-8" />
                    <span className="text-sm text-muted-foreground">Carregando usuários...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow key="empty-row">
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/50">
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuItem onClick={() => onEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => onDelete(user)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      {user.role === 'admin' ? (
                        <Badge variant="outline" className="gap-1 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400 font-semibold px-2 py-0.5">
                          <Shield className="w-3 h-3" />
                          Administrador
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-400 font-semibold px-2 py-0.5">
                          <User className="w-3 h-3" />
                          Usuário Comum
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.active !== false ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 font-semibold px-2 py-0.5">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado com os filtros aplicados.
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {totalItems > 0 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalRows={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
};
