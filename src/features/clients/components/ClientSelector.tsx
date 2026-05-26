import { useState } from 'react';
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

  const selectedClient = clients.find(c => String(c.id) === String(selectedClientId));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full md:min-w-[200px] justify-between h-auto py-2", className)}
        >
          <div className="flex flex-col items-start overflow-hidden mr-2">
            {selectedClient ? (
              <>
                <span className="font-semibold text-foreground truncate w-full text-left text-xs">
                  {selectedClient.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">Selecione um cliente...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Pesquisar cliente..." />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name} ${client.uc_number || ''}`}
                  onSelect={() => {
                    onSelect(client.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn(
                      "font-semibold truncate text-xs",
                      String(client.id) === String(selectedClientId) ? "text-primary" : ""
                    )}>
                      {client.name}
                    </span>
                    {String(client.id) === String(selectedClientId) && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {client.uc_number ? `UC: ${client.uc_number}` : 'Sem UC'}
                    {client.distributor ? ` · ${client.distributor}` : ''}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
