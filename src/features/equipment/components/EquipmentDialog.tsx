import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';

interface EquipmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: any | null;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  calculateKWhDia: (data: any) => number;
  calculateKWh: (data: any) => number;
}

export const EquipmentDialog: React.FC<EquipmentDialogProps> = ({
  isOpen,
  onOpenChange,
  editingItem,
  formData,
  setFormData,
  onSubmit,
  isLoading,
  calculateKWhDia,
  calculateKWh,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          <DialogDescription>
            Insira as informações técnicas do equipamento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="eq-name">Nome do Equipamento</Label>
              <Input 
                id="eq-name" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Ar Condicionado Central" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="power">Potência (W)</Label>
              <Input 
                id="power" 
                required 
                type="number" 
                value={formData.power_w} 
                onChange={(e) => setFormData({ ...formData, power_w: e.target.value })} 
                placeholder="1200" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Quantidade</Label>
              <Input 
                id="qty" 
                required 
                type="number" 
                value={formData.quantity} 
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} 
                placeholder="1" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Horas/Dia</Label>
              <Input 
                id="hours" 
                required 
                type="number" 
                step="0.1" 
                value={formData.hours_per_day} 
                onChange={(e) => setFormData({ ...formData, hours_per_day: e.target.value })} 
                placeholder="8" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tariff">Tarifa (R$/kWh)</Label>
              <Input 
                id="tariff" 
                type="number" 
                step="0.0001" 
                value={formData.tariff} 
                onChange={(e) => setFormData({ ...formData, tariff: e.target.value })} 
                placeholder="0.513" 
              />
            </div>
          </div>

          <Card className="bg-muted/50 p-4 border-none shadow-none space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Carga Diária</span>
              <span className="text-sm font-bold">{calculateKWhDia(formData).toFixed(2)} kWh/dia</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-[10px] font-bold text-primary uppercase">Consumo Estimado</span>
              <div className="text-right">
                <span className="text-lg font-bold text-primary">{calculateKWh(formData).toFixed(2)}</span>
                <span className="text-[10px] font-bold text-primary ml-1">kWh/mês</span>
              </div>
            </div>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              Salvar Equipamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
