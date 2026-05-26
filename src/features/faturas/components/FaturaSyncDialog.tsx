import { useState } from 'react';
import { CloudLightning, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface FaturaSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  syncing: boolean;
  onSync: (params: { installationId: string; referenceMonth: string }) => Promise<void>;
}

export function FaturaSyncDialog({
  open,
  onOpenChange,
  clients,
  syncing,
  onSync,
}: FaturaSyncDialogProps) {
  const [syncClientId, setSyncClientId] = useState<string>('all');
  const [syncMonth, setSyncMonth] = useState<string>('all');
  const [syncYear, setSyncYear] = useState<string>('all');
  const [openCombobox, setOpenCombobox] = useState(false);

  const selectedClient = clients.find((c) => (c.uc_number || c.id.toString()) === syncClientId);
  const triggerLabel = syncClientId === 'all'
    ? 'Todos os Clientes'
    : selectedClient
      ? `${selectedClient.name}${selectedClient.uc_number ? ` (UC: ${selectedClient.uc_number})` : ''}`
      : 'Selecione o Cliente';

  const handleSync = async () => {
    let referenceMonth = 'all';
    if (syncMonth !== 'all' && syncYear !== 'all') {
      referenceMonth = `${syncMonth}/${syncYear}`;
    }
    await onSync({
      installationId: syncClientId,
      referenceMonth,
    });
  };

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: currentYear - 2023 + 1 },
    (_, i) => 2023 + i
  );

  const months = [
    { id: 'all', name: 'Todos os Meses' },
    { id: '01', name: 'Janeiro' },
    { id: '02', name: 'Fevereiro' },
    { id: '03', name: 'Março' },
    { id: '04', name: 'Abril' },
    { id: '05', name: 'Maio' },
    { id: '06', name: 'Junho' },
    { id: '07', name: 'Julho' },
    { id: '08', name: 'Agosto' },
    { id: '09', name: 'Setembro' },
    { id: '10', name: 'Outubro' },
    { id: '11', name: 'Novembro' },
    { id: '12', name: 'Dezembro' }
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setOpenCombobox(false); }}>
      <DialogContent className="sm:max-w-lg w-full bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <CloudLightning className="h-5 w-5 text-primary" />
            Sincronizar com PowerHub
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Selecione o cliente e o período de referência para buscar as faturas diretamente na API.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sync-client" className="text-xs font-semibold text-foreground/80">
              Cliente / Unidade Consumidora (UC)
            </Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  id="sync-client"
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full h-10 justify-between border border-input bg-background px-3 py-2 text-sm font-normal text-foreground hover:bg-background"
                >
                  <span className="truncate">{triggerLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" disablePortal={true}>
                <Command>
                  <CommandInput placeholder="Pesquisar cliente..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Todos os Clientes all"
                        data-checked={syncClientId === 'all'}
                        onSelect={() => {
                          setSyncClientId('all');
                          setOpenCombobox(false);
                        }}
                      >
                        Todos os Clientes
                      </CommandItem>
                      {clients.map((c) => {
                        const val = c.uc_number || c.id.toString();
                        return (
                          <CommandItem
                            key={c.id}
                            value={`${c.name} ${c.uc_number || ''}`}
                            data-checked={syncClientId === val}
                            onSelect={() => {
                              setSyncClientId(val);
                              setOpenCombobox(false);
                            }}
                          >
                            <span>{c.name}</span>
                            {c.uc_number && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (UC: {c.uc_number})
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sync-month" className="text-xs font-semibold text-foreground/80">
                Mês de Referência
              </Label>
              <Select value={syncMonth} onValueChange={setSyncMonth}>
                <SelectTrigger id="sync-month" className="w-full h-10 border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <SelectValue placeholder="Selecione o Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.id} value={month.id}>
                      {month.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="sync-year" className="text-xs font-semibold text-foreground/80">
                Ano de Referência
              </Label>
              <Select value={syncYear} onValueChange={setSyncYear}>
                <SelectTrigger id="sync-year" className="w-full h-10 border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <SelectValue placeholder="Selecione o Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  {years.map((year => <SelectItem key={year} value={String(year)} > {year}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {((syncMonth !== 'all' && syncYear === 'all') || (syncMonth === 'all' && syncYear !== 'all')) && (
            <p className="text-xs border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-2">
              * Selecione tanto o mês quanto o ano para filtrar por um período específico, ou ambos como "Todos" para trazer todo o histórico.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-foreground"
            disabled={syncing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
