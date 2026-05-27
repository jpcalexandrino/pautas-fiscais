import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { useUser } from '../context/UserContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UserDialog } from '../components/UserDialog';
import { UsersTable, ALL_COLUMNS, DEFAULT_COLUMNS } from '../components/UsersTable';
import { ColumnCustomizer } from '@features/data/components/ColumnCustomizer';
import { UsersEmptyState } from '../components/UsersEmptyState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from '@tanstack/react-router';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

export default function UsersPage() {
  const { getUsers, createUser, updateUser, deleteUser, resetUserPassword, loading: isLoading } = useUser();
  const { showConfirm } = useAlert();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [createdUser, setCreatedUser] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('users_visible_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('users_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const resetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS);
  };

  const emptyForm = {
    name: '',
    email: '',
    role: 'user',
    active: true,
  };

  const [formData, setFormData] = useState(emptyForm);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, [getUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleOpenModal = (user: any | null = null) => {
    if (user) {
      setEditingItem(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'user',
        active: user.active !== false,
      });
    } else {
      setEditingItem(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateUser(editingItem.id, formData);
        toast.success('Usuário atualizado com sucesso!');
      } else {
        const newUser = await createUser(formData);
        setCreatedUser(newUser);
        toast.success('Usuário cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error('Erro ao salvar usuário', {
        description: error.message || 'Não foi possível completar a operação.',
      });
    }
  };

  const handleDelete = async (user: any) => {
    const confirmed = await showConfirm(
      `Tem certeza que deseja excluir o usuário "${user.name}"? Isso revogará completamente seus acessos.`,
      'Excluir Usuário',
      'error'
    );
    if (confirmed) {
      try {
        await deleteUser(user.id);
        toast.success('Usuário excluído com sucesso!');
        loadUsers();
      } catch (error: any) {
        toast.error('Erro ao excluir usuário', {
          description: error.message || 'Não foi possível completar a operação.'
        });
      }
    }
  };

  const handleResetPassword = async (id: string | number) => {
    const confirmed = await showConfirm(
      `Tem certeza que deseja resetar a senha de "${editingItem?.name}"? Uma nova senha temporária será gerada e exibida.`,
      'Resetar Senha',
      'warning'
    );
    if (!confirmed) return;

    try {
      const response = await resetUserPassword(id);
      setCreatedUser({
        name: editingItem.name,
        email: editingItem.email,
        tempPassword: response.tempPassword
      });
      setIsModalOpen(false);
      toast.success('Senha resetada com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao resetar senha', {
        description: error.message || 'Não foi possível completar a operação.',
      });
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie o controle de acesso e usuários do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnCustomizer
            columns={ALL_COLUMNS}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onReset={resetColumns}
          />
          {isAdmin && (
            <Button size="sm" onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading || loading || users.length > 0 ? (
            <UsersTable
              users={users}
              loading={isLoading || loading}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              isAdmin={isAdmin}
              visibleColumns={visibleColumns}
            />
          ) : (
            <UsersEmptyState onNewUser={isAdmin ? () => handleOpenModal() : undefined} />
          )}
        </CardContent>
      </Card>

      <UserDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onResetPassword={handleResetPassword}
      />

      {/* Success Dialog showing the generated password */}
      <Dialog open={!!createdUser} onOpenChange={(open) => { if (!open) { setCreatedUser(null); setCopied(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <Check className="w-5 h-5" />
              Usuário Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              O usuário foi registrado no sistema. Guarde a senha temporária abaixo para repassar ao usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="created-name">Nome</Label>
              <Input
                id="created-name"
                readOnly
                value={createdUser?.name || ''}
                className="bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created-email">E-mail (Login)</Label>
              <Input
                id="created-email"
                readOnly
                value={createdUser?.email || ''}
                className="bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="created-password">Senha Temporária</Label>
              <InputGroup className="bg-muted/50">
                <InputGroupInput
                  id="created-password"
                  readOnly
                  value={createdUser?.tempPassword || ''}
                  className="font-mono text-sm select-all cursor-default"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(createdUser?.tempPassword || '');
                      toast.success('Senha copiada para a área de transferência!');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 animate-in fade-in zoom-in duration-200" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setCreatedUser(null)} className="w-full">
              Fechar e Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
