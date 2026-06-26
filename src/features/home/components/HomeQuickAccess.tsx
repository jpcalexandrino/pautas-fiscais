import { useNavigate } from '@tanstack/react-router';
import { Upload, ArrowRight, Database, ArrowLeftRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface QuickAccessItem {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

const quickAccessItems: QuickAccessItem[] = [
  {
    icon: Upload,
    title: 'Importar PDF',
    description: 'Faça upload do Diário Oficial para extrair dados com IA.',
    to: '/import',
  },
  {
    icon: Database,
    title: 'Dados de Pauta',
    description: 'Consulte e exporte os dados planilhados das pautas processadas.',
    to: '/dados',
  },
  {
    icon: ArrowLeftRight,
    title: 'Mapeamento De-Para',
    description: 'Gerencie as regras de equivalência de termos por estado.',
    to: '/de-para',
  },
];

export default function HomeQuickAccess() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickAccessItems.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <Card
            key={idx}
            className="group hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between"
            onClick={() => navigate({ to: feature.to as any })}
          >
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-xl bg-background border-2 border-primary flex items-center justify-center shrink-0 shadow-sm text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-2">
                <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <CardTitle className="text-sm font-bold tracking-tight">{feature.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed line-clamp-3 pt-1">
                {feature.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t bg-muted/30 dark:bg-muted/10 px-6 py-3 flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Acessar módulo
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all transform group-hover:translate-x-1" />
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
