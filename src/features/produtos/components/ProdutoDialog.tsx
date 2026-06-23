import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface ProdutoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Record<string, unknown> | null;
  formData: Record<string, unknown>;
  setFormData: (data: Record<string, unknown>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ProdutoDialog({
  isOpen, onOpenChange, editing, formData, setFormData, onSubmit, isLoading,
}: ProdutoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>Cadastro mestre de produtos com código ERP e GTIN.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao_interna">Descrição Interna *</Label>
              <Input
                id="descricao_interna"
                required
                value={String(formData.descricao_interna || '')}
                onChange={(e) => setFormData({ ...formData, descricao_interna: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_interno">Código ERP</Label>
              <Input
                id="codigo_interno"
                value={String(formData.codigo_interno || '')}
                onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gtin_13">GTIN/EAN-13</Label>
              <Input
                id="gtin_13"
                maxLength={13}
                value={String(formData.gtin_13 || '')}
                onChange={(e) => setFormData({ ...formData, gtin_13: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="embalagem">Embalagem</Label>
              <Input
                id="embalagem"
                placeholder="PET, LATA, GARRAFA"
                value={String(formData.embalagem || '')}
                onChange={(e) => setFormData({ ...formData, embalagem: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conteudo_volume">Volume (ml/g)</Label>
              <Input
                id="conteudo_volume"
                type="number"
                value={formData.conteudo_volume != null ? String(formData.conteudo_volume) : ''}
                onChange={(e) => setFormData({ ...formData, conteudo_volume: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
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
