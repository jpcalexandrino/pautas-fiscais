import { Upload, Activity, ClipboardCheck, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomeWorkFlow() {
  return (
    <Card className="border border-muted/50 rounded-xl shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" /> Entenda a Automação
        </CardTitle>
        <CardDescription className="text-xs">
          O ciclo de vida dos dados desde a captura pública até a inserção nas tabelas de preço do ERP.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 relative">
        
        {/* Timeline layout para telas maiores */}
        <div className="relative flex flex-col md:flex-row gap-8 justify-between before:absolute before:inset-0 before:left-5 md:before:left-0 md:before:top-4.5 before:h-full md:before:h-[1px] before:w-[1px] md:before:w-full before:bg-muted/80 before:z-0">
          {[
            { step: '01', title: 'Upload do Diário Oficial', desc: 'Envie o PDF contendo as publicações fiscais e anexos de pautas.', icon: Upload },
            { step: '02', title: 'Extração e Cruzamento Inteligente', desc: 'A IA extrai e mapeia os dados cruzando com o histórico De-Para e regras do catálogo.', icon: Activity },
            { step: '03', title: 'Revisão e Homologação', desc: 'Valide possíveis exceções e grave os valores oficiais no banco de dados.', icon: ClipboardCheck },
          ].map((item, idx) => {
            const StepIcon = item.icon;
            return (
              <div key={idx} className="relative z-10 flex flex-row md:flex-col items-start gap-4 md:w-1/3 group">
                <div className="w-9 h-9 rounded-full bg-background border border-primary flex items-center justify-center shrink-0 shadow-sm font-bold text-xs text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                  <StepIcon className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1 md:pt-2">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Passo {item.step}</div>
                  <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </CardContent>
    </Card>
  );
}
