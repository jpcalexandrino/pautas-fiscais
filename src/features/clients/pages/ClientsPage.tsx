import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { useClient } from '../context/ClientContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ClientDialog } from '../components/ClientDialog';
import { ClientsTable } from '../components/ClientsTable';
import { ClientsEmptyState } from '../components/ClientsEmptyState';

const TEMPLATE_HEADERS = [
  'Número da UC', 'Nome da UC', 'Distribuidora', 'Subgrupo',
  'CPF/CNPJ', 'E-mail', 'CEP', 'Estado', 'Cidade',
  'Logradouro', 'Número', 'Complemento'
];

function handleDownloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  ws['!cols'] = TEMPLATE_HEADERS.map(h => ({ wch: Math.max(h.length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, 'modelo_importacao_clientes.xlsx');
}

function sanitizeToString(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    if (value > 1e6 || value < -1e6) {
      return BigInt(Math.round(value)).toString();
    }
    return String(value);
  }
  const str = String(value).trim();
  if (/^-?\d+([.,]\d+)?e[+-]?\d+$/i.test(str)) {
    try {
      const normalized = str.replace(',', '.');
      return BigInt(Math.round(Number(normalized))).toString();
    } catch { return str; }
  }
  return str;
}

const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        if (!evt.target?.result) return resolve([]);
        const data = new Uint8Array(evt.target.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { raw: true });

        if (rows.length === 0) return resolve([]);

        const mapped = (rows as any[]).map(row => ({
          uc_number: sanitizeToString(row['Número da UC'] || row['UC'] || ''),
          name: row['Nome da UC'] || row['Nome'] || '',
          distributor: row['Distribuidora'] || '',
          subgroup: row['Subgrupo'] || '',
          cnpj: sanitizeToString(row['CPF/CNPJ'] || row['CNPJ'] || ''),
          contact_email: row['E-mail'] || row['Email'] || '',
          cep: sanitizeToString(row['CEP'] || ''),
          uf: row['Estado'] || row['UF'] || '',
          city: row['Cidade'] || '',
          address: row['Logradouro'] || row['Endereço'] || '',
          number: sanitizeToString(row['Número'] || ''),
          complement: row['Complemento'] || '',
        })).filter(c => c.name && c.name.trim() !== '');

        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export default function ClientsPage() {
  const { getClients, createClient, updateClient, deleteClient, bulkCreateClients, loading: isLoading } = useClient();
  const { showConfirm } = useAlert();
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const results = await Promise.all(files.map(parseExcelFile));
      const allMappedClients = results.flat();

      if (allMappedClients.length === 0) {
        toast.warning('Nenhum cliente válido encontrado nas planilhas.');
        return;
      }

      await bulkCreateClients(allMappedClients);
      toast.success('Importação concluída', {
        description: `${allMappedClients.length} clientes importados de ${files.length} arquivo(s).`,
      });
      loadClients();
    } catch (error) {
      console.error('Erro ao importar Excel:', error);
      toast.error('Erro ao processar os arquivos', {
        description: 'Verifique o formato e as colunas das planilhas.',
      });
    }

    e.target.value = '';
  };

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie a base de clientes do sistema.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls, .csv" multiple className="hidden" />
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Baixar Modelo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Importar Excel</span>
          </Button>
          <Button size="sm" onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
              <Spinner className="w-8 h-8" />
              <p className="text-muted-foreground animate-pulse font-medium">Carregando clientes...</p>
            </div>
          ) : clients.length > 0 ? (
            <ClientsTable
              clients={clients}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
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
    </div>
  );
}

