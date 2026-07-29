import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export interface Produto {
  id: number;
  descricao_interna: string;
  codigo_interno?: string;
}

interface ProdutoSelectorProps {
  produtos: Produto[];
  value: number | null;
  onChange: (id: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProdutoSelector({
  produtos,
  value,
  onChange,
  placeholder = "Selecione o produto",
  disabled = false,
}: ProdutoSelectorProps) {
  const [open, setOpen] = useState(false);

  const selected = produtos.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selected
            ? `${selected.descricao_interna}${selected.codigo_interno ? ` (${selected.codigo_interno})` : ""}`
            : <span className="text-muted-foreground italic">{placeholder}</span>}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput placeholder="Pesquisar produto..." />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {produtos.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.descricao_interna}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === p.id ? "opacity-100 text-primary" : "opacity-0"
                    )}
                  />
                  {`${p.descricao_interna}${p.codigo_interno ? ` (${p.codigo_interno})` : ""}`}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
