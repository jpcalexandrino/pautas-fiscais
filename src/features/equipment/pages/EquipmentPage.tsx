import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useClient } from '@features/clients/context/ClientContext';
import { useEquipmentContext } from '../context/EquipmentContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import ClientSelector from '@features/clients/components/ClientSelector';
import { EquipmentTable } from '../components/EquipmentTable';
import { EquipmentDialog } from '../components/EquipmentDialog';
import { EquipmentEmptyState } from '../components/EquipmentEmptyState';
import { Card, CardContent } from '@/components/ui/card';

interface EquipmentFormData {
  name: string;
  power_w: string | number;
  hours_per_day: string | number;
  quantity: string | number;
  tariff: string | number;
}

export default function EquipmentPage() {
  const { getClients } = useClient();
  const { getEquipmentByClient, createEquipment, updateEquipment, deleteEquipment, loading: isLoading } = useEquipmentContext();
  const { showConfirm } = useAlert();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | number>('');
  const [equipment, setEquipment] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    power_w: '',
    hours_per_day: '',
    quantity: '1',
    tariff: '0.513',
  });

  const loadClients = useCallback(async () => {
    const data = await getClients();
    setClients(data);
    if (data.length > 0 && !selectedClientId) {
      setSelectedClientId(data[0].id);
    }
  }, [getClients, selectedClientId]);

  const loadEquipment = useCallback(async (clientId: string | number) => {
    const data = await getEquipmentByClient(clientId);
    const processedData = data.map((item: any) => ({
      ...item,
      kwh_dia: calculateKWhDia(item),
      kwh_mes: calculateKWh(item),
      valor_estimado: calculateKWh(item) * (parseFloat(item.tariff) || 0.513)
    }));
    setEquipment(processedData);
  }, [getEquipmentByClient]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (selectedClientId) {
      loadEquipment(selectedClientId);
    } else {
      setEquipment([]);
    }
  }, [selectedClientId, loadEquipment]);

  const handleOpenModal = (item: any | null = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        power_w: item.power_w || '',
        hours_per_day: item.hours_per_day || '',
        quantity: item.quantity || '1',
        tariff: item.tariff || '0.513',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        power_w: '',
        hours_per_day: '',
        quantity: '1',
        tariff: '0.513',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) return;

    try {
      const power = parseFloat(formData.power_w as string) || 0;
      const hours = parseFloat(formData.hours_per_day as string) || 0;
      const qty = parseInt(formData.quantity as string) || 0;
      const wh_per_day = (power * hours * qty);

      const dataToSave = {
        name: formData.name || 'Equipamento',
        power_w: formData.power_w,
        hours_per_day: formData.hours_per_day,
        quantity: formData.quantity,
        tariff: formData.tariff,
        wh_per_day: wh_per_day / 1000
      };

      if (editingItem) {
        await updateEquipment(editingItem.id, dataToSave);
        toast.success('Equipamento atualizado com sucesso!');
      } else {
        await createEquipment({ ...dataToSave, client_id: selectedClientId });
        toast.success('Equipamento cadastrado com sucesso!');
      }
      setIsModalOpen(false);
      loadEquipment(selectedClientId);
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast.error('Erro ao salvar equipamento');
    }
  };

  const handleDelete = async (item: any) => {
    const confirmed = await showConfirm('Tem certeza que deseja excluir este equipamento?', 'Excluir Equipamento', 'error');
    if (confirmed) {
      try {
        await deleteEquipment(item.id);
        toast.success('Equipamento removido com sucesso!');
        loadEquipment(selectedClientId);
      } catch (error) {
        toast.error('Erro ao excluir equipamento');
      }
    }
  };

  function calculateKWh(item: any): number {
    const power = parseFloat(item.power_w) || 0;
    const hours = parseFloat(item.hours_per_day) || 0;
    const qty = parseInt(item.quantity) || 0;
    return (power * hours * 22 * qty) / 1000;
  }

  function calculateKWhDia(item: any): number {
    const power = parseFloat(item.power_w) || 0;
    const hours = parseFloat(item.hours_per_day) || 0;
    const qty = parseInt(item.quantity) || 0;
    return (power * hours * qty) / 1000;
  }

  return (
    <div className="animate-fade-in pb-10 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
            Equipamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie o levantamento de carga detalhado por unidade consumidora.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onSelect={setSelectedClientId}
            className="w-full sm:w-[280px]"
          />
          <Button
            onClick={() => handleOpenModal()}
            disabled={!selectedClientId}
            className="gap-2 shadow-sm bg-primary hover:shadow-md transition-all active:scale-95 px-4"
          >
            <Plus className="w-4 h-4" /> Novo Item
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-md overflow-hidden">
        <CardContent className="p-0">
          {!selectedClientId ? (
            <EquipmentEmptyState />
          ) : (
            <EquipmentTable
              equipment={equipment}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      <EquipmentDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        calculateKWhDia={calculateKWhDia}
        calculateKWh={calculateKWh}
      />
    </div>
  );
}

