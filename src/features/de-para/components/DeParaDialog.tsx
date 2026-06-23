import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ProdutoSelector } from '@/features/produtos/components/ProdutoSelector';

interface DeParaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Record<string, unknown> | null;
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  estados: Record<string, unknown>[];
  produtos: Record<string, unknown>[];
}

export function DeParaDialog({
  isOpen, onOpenChange, editing, formData, setFormData, onSubmit, isLoading, estados, produtos,
}: DeParaDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" style={{ maxWidth: '650px', width: '100%' }}>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar De-Para' : 'Novo De-Para'}</DialogTitle>
          <DialogDescription>Mapeamento de como o estado descreve o produto na pauta fiscal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Estado (UF) *</Label>
            <Select
              value={String(formData.uf || '')}
              onValueChange={(v) => setFormData({ ...formData, uf: v })}
              disabled={!!editing}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecione a UF" /></SelectTrigger>
              <SelectContent>
                {estados.map((e) => (
                  <SelectItem key={String(e.uf)} value={String(e.uf)}>
                    {String(e.uf)} - {String(e.nome)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="termo">Termo na Pauta do Estado *</Label>
            <Input
              id="termo"
              required
              placeholder='Ex: CERVEJA IMPERIO PILSEN LN 355ML'
              value={String(formData.termo_descricao_estado || '')}
              onChange={(e) => setFormData({ ...formData, termo_descricao_estado: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gtin_estado">GTIN na Pauta (opcional)</Label>
            <Input
              id="gtin_estado"
              maxLength={13}
              value={String(formData.gtin_estado || '')}
              onChange={(e) => setFormData({ ...formData, gtin_estado: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Produto Interno *</Label>
            <ProdutoSelector
              produtos={produtos}
              value={formData.fk_produto ? Number(formData.fk_produto) : null}
              onChange={(id) => setFormData({ ...formData, fk_produto: id })}
              disablePortal
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner className="w-4 h-4" /> : editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
