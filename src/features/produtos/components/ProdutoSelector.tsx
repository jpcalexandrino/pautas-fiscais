import { useState, useMemo } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ProdutoSelectorProps {
  produtos: Record<string, unknown>[];
  value: number | null | undefined;
  onChange: (id: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  disablePortal?: boolean;
}

function getProdutoFields(p: Record<string, unknown>) {
  return {
    id: Number(p.id),
    descricao_interna: String(p.descricao_interna ?? ''),
    codigo_interno: p.codigo_interno ? String(p.codigo_interno) : undefined,
  };
}

function formatProduto(p: ReturnType<typeof getProdutoFields>) {
  return `${p.descricao_interna}${p.codigo_interno ? ` (${p.codigo_interno})` : ''}`;
}

export function ProdutoSelector({
  produtos,
  value,
  onChange,
  placeholder = 'Selecione o produto',
  className,
  disabled = false,
  disablePortal = false,
}: ProdutoSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedProd = useMemo(() => {
    return produtos.find((p) => getProdutoFields(p).id === value);
  }, [produtos, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="produto-list"
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "flex h-8 w-full max-w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50 min-w-0 overflow-hidden",
            className
          )}
        >
          <span
            className={cn(
              "truncate text-left flex-1 min-w-0",
              !selectedProd && "text-muted-foreground italic"
            )}
          >
            {selectedProd ? formatProduto(getProdutoFields(selectedProd)) : placeholder}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 max-h-64 overflow-y-auto"
        align="start"
        disablePortal={disablePortal}
      >
        <Command>
          <CommandInput placeholder="Pesquisar produto..." />
          <CommandList id="produto-list">
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {produtos.map((p) => {
                const fields = getProdutoFields(p);
                const isSelected = value === fields.id;
                return (
                  <CommandItem
                    key={fields.id}
                    value={formatProduto(fields)}
                    onSelect={() => {
                      onChange(fields.id);
                      setOpen(false);
                    }}
                    aria-selected={isSelected}
                  >
                    <span className="flex items-center gap-2">
                      {isSelected && (
                        <CheckIcon className="size-4 text-primary shrink-0" />
                      )}
                      {formatProduto(fields)}
                    </span>
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
