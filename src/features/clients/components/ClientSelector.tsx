import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Client {
  id: string | number;
  name: string;
  uc_number?: string;
  distributor?: string;
}

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId: string | number;
  onSelect: (clientId: string | number) => void;
  className?: string;
}

export default function ClientSelector({
  clients,
  selectedClientId,
  onSelect,
  className = ''
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedClient = useMemo(() => {
    return clients.find(c => String(c.id) === String(selectedClientId));
  }, [clients, selectedClientId]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 px-3 font-normal bg-background hover:bg-muted/40 border-input shadow-none transition-colors",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate mr-2 text-left text-xs">
            {selectedClient ? (
              <>
                <span className="font-medium text-foreground truncate max-w-48">
                  {selectedClient.name}
                </span>
                {selectedClient.uc_number && (
                  <span className="text-muted-foreground/60 text-[11px] shrink-0 before:content-['•'] before:mr-2 before:text-muted-foreground/30">
                    {selectedClient.uc_number}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground text-xs">Selecione um cliente...</span>
            )}
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0.5 rounded-md" 
        align="start"
        sideOffset={4}
      >
        <Command filter={(value, search) => {
          if (value.toLowerCase().includes(search.toLowerCase())) return 1;
          return 0;
        }}>
          <CommandInput 
            placeholder="Buscar cliente..." 
            className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent w-full" 
          />
          <CommandList className="max-h-64 overflow-y-auto scrollbar-none border-t border-border/40">
            <CommandEmpty className="py-3 text-center text-xs text-muted-foreground/70">
              Nenhum cliente encontrado.
            </CommandEmpty>
            <CommandGroup className="p-0.5">
              {clients.map((client) => {
                const isSelected = String(client.id) === String(selectedClientId);
                const filterValue = `${client.name} ${client.uc_number || ''} ${client.distributor || ''}`;

                return (
                  <CommandItem
                    key={client.id}
                    value={filterValue}
                    onSelect={() => {
                      onSelect(client.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-4 h-7 px-2 my-0.5 rounded-xs cursor-pointer transition-colors text-xs",
                      "data-[selected='true']:bg-muted/60 data-[selected='true']:text-accent-foreground",
                      isSelected && "bg-primary/3"
                    )}
                  >
                    {/* Linha Única: Nome + Infos Secundárias alinhadas horizontalmente */}
                    <div className="flex items-baseline gap-2 truncate min-w-0 flex-1">
                      <span className={cn(
                        "truncate text-xs",
                        isSelected ? "font-medium text-primary" : "text-foreground/90"
                      )}>
                        {client.name}
                      </span>
                      
                      {(client.uc_number || client.distributor) && (
                        <span className="text-[10px] text-muted-foreground/50 font-normal truncate shrink-0">
                          {client.uc_number}
                          {client.uc_number && client.distributor && ' · '}
                          {client.distributor}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
