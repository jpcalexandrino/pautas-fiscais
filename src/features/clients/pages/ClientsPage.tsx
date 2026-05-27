import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { useClient } from '../context/ClientContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { ClientDialog } from '../components/ClientDialog';
import { ClientsImportDialog } from '../components/ClientsImportDialog';
import { ClientsTable, ALL_COLUMNS, DEFAULT_COLUMNS } from '../components/ClientsTable';
import { ColumnCustomizer } from '@features/data/components/ColumnCustomizer';
import { ClientsEmptyState } from '../components/ClientsEmptyState';

export default function ClientsPage() {
  const { getClients, createClient, updateClient, deleteClient, bulkCreateClients, loading: isLoading } = useClient();
  const { showConfirm } = useAlert();
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('clients_visible_columns');
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
    localStorage.setItem('clients_visible_columns', JSON.stringify(visibleColumns));
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
    uc_number: '', name: '', distributor: '', subgroup: '', cnpj: '',
    contact_email: '', cep: '', uf: '', city: '', address: '', number: '', complement: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  const loadClients = useCallback(async () => {
    const data = await getClients();
    setClients(data);
  }, [getClients]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleOpenModal = (client: any | null = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        uc_number: client.uc_number || '',
        name: client.name || '',
        distributor: client.distributor || '',
        subgroup: client.subgroup || '',
        cnpj: client.cnpj || '',
        contact_email: client.contact_email || '',
        cep: client.cep || '',
        uf: client.uf || '',
        city: client.city || '',
        address: client.address || '',
        number: client.number || '',
        complement: client.complement || '',
      });
    } else {
      setEditingClient(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient(formData);
        toast.success('Cliente criado com sucesso!');
      }
      setIsModalOpen(false);
      loadClients();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente', {
        description: 'Não foi possível completar a operação.',
      });
    }
  };

  const handleDelete = async (client: any) => {
    const confirmed = await showConfirm('Tem certeza que deseja excluir este cliente?', 'Excluir Cliente', 'error');
    if (confirmed) {
      try {
        await deleteClient(client.id);
        toast.success('Cliente excluído com sucesso!');
        loadClients();
      } catch (error) {
        toast.error('Erro ao excluir cliente');
      }
    }
  };

  const handleImportComplete = async (importedClients: any[]) => {
    try {
      await bulkCreateClients(importedClients);
      toast.success('Importação concluída', {
        description: `${importedClients.length} clientes importados com sucesso.`,
      });
      loadClients();
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      toast.error('Erro ao salvar os clientes importados.');
      throw error;
    }
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie a base de clientes do sistema.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ColumnCustomizer
            columns={ALL_COLUMNS}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            onReset={resetColumns}
          />
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Importar Planilha
          </Button>
          <Button size="sm" onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading || clients.length > 0 ? (
            <ClientsTable
              clients={clients}
              loading={isLoading}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              visibleColumns={visibleColumns}
            />
          ) : (
            <ClientsEmptyState onNewClient={() => handleOpenModal()} />
          )}
        </CardContent>
      </Card>

      <ClientDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingClient={editingClient}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      <ClientsImportDialog
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportComplete={handleImportComplete}
        isLoading={isLoading}
      />
    </div>
  );
}


