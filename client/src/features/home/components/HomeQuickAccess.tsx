import { useNavigate } from '@tanstack/react-router';
import { Upload, ArrowRight, Database, ArrowLeftRight, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  {
    icon: Tag,
    title: 'Termos das Pautas',
    description: 'Gerencie os termos utilizados nas pautas.',
    to: '/settings',
  }
];

export default function HomeQuickAccess() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickAccessItems.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <Card
            key={idx}
            className="group hover:border-primary/40 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between border-muted/50 rounded-xl bg-card overflow-hidden"
            onClick={() => navigate({ to: feature.to as any })}
          >
            <CardContent className="p-5 flex flex-col justify-between flex-1 gap-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary transition-all duration-300">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground tracking-tight">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary pt-2">
                <span>Acessar</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
