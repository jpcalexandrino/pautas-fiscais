import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Sliders, MapPin, Layers, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUfCompactors } from '../hooks/useUfCompactors';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/shared/components/ui/spinner';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
];

const DEFAULT_HEADER_MAPPINGS = {
  codigo: ['CODIGO', 'CÓDIGO', 'NCM', 'ITEM', 'CHAVE', 'CEST'],
  descricao: ['PRODUTO', 'MARCA', 'DESCRICAO', 'DESCRIÇÃO', 'MARCA_PRODUTO'],
  embalagem: ['EMBALAGEM', 'RECIPIENTE', 'TIPO'],
  volume: ['VOLUME', 'CAPACIDADE', 'CONTEUDO', 'CONTEÚDO'],
  preco: ['PMPF', 'PRECO', 'PREÇO', 'VALOR', 'PAUTA', 'CUSTO']
};

export function UfCompactorConfigCard() {
  const { configs, isLoading, saveConfig, resetConfig } = useUfCompactors();
  const { user } = useAuth();
  const { showConfirm } = useAlert();
  const isAdmin = user?.role === 'admin';

  const [selectedUf, setSelectedUf] = useState<string>('MG');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [codigoTerms, setCodigoTerms] = useState('');
  const [descricaoTerms, setDescricaoTerms] = useState('');
  const [embalagemTerms, setEmbalagemTerms] = useState('');
  const [volumeTerms, setVolumeTerms] = useState('');
  const [precoTerms, setPrecoTerms] = useState('');

  const [split2Columns, setSplit2Columns] = useState(false);
  const [parallelTablesSplit, setParallelTablesSplit] = useState(false);
  const [matrixHeader, setMatrixHeader] = useState(false);
  const [subheaders, setSubheaders] = useState(false);

  useEffect(() => {
    const config = configs.find(c => c.uf.toUpperCase() === selectedUf.toUpperCase());
    if (config) {
      setCodigoTerms((config.header_mappings.codigo || DEFAULT_HEADER_MAPPINGS.codigo).join(', '));
      setDescricaoTerms((config.header_mappings.descricao || DEFAULT_HEADER_MAPPINGS.descricao).join(', '));
      setEmbalagemTerms((config.header_mappings.embalagem || DEFAULT_HEADER_MAPPINGS.embalagem).join(', '));
      setVolumeTerms((config.header_mappings.volume || DEFAULT_HEADER_MAPPINGS.volume).join(', '));
      setPrecoTerms((config.header_mappings.preco || DEFAULT_HEADER_MAPPINGS.preco).join(', '));

      setSplit2Columns(!!config.features.split_2_columns);
      setParallelTablesSplit(!!config.features.parallel_tables_split);
      setMatrixHeader(!!config.features.matrix_header);
      setSubheaders(!!config.features.subheaders);
    } else {
      setCodigoTerms(DEFAULT_HEADER_MAPPINGS.codigo.join(', '));
      setDescricaoTerms(DEFAULT_HEADER_MAPPINGS.descricao.join(', '));
      setEmbalagemTerms(DEFAULT_HEADER_MAPPINGS.embalagem.join(', '));
      setVolumeTerms(DEFAULT_HEADER_MAPPINGS.volume.join(', '));
      setPrecoTerms(DEFAULT_HEADER_MAPPINGS.preco.join(', '));

      setSplit2Columns(selectedUf === 'SE');
      setParallelTablesSplit(selectedUf === 'MG' || selectedUf === 'MA');
      setMatrixHeader(selectedUf === 'PR');
      setSubheaders(selectedUf === 'SE');
    }
  }, [selectedUf, configs]);

  const parseTerms = (str: string) =>
    str.split(/[,;\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSubmitting(true);
    try {
      const headerMappings = {
        codigo: parseTerms(codigoTerms),
        descricao: parseTerms(descricaoTerms),
        embalagem: parseTerms(embalagemTerms),
        volume: parseTerms(volumeTerms),
        preco: parseTerms(precoTerms)
      };

      const features = {
        split_2_columns: split2Columns,
        parallel_tables_split: parallelTablesSplit,
        matrix_header: matrixHeader,
        subheaders: subheaders,
        ignore_noise: true
      };

      await saveConfig(selectedUf, headerMappings, features);
      toast.success(`Configurações da UF ${selectedUf} salvas!`);
    } catch (err: any) {
      toast.error(err.message || `Erro ao salvar configurações para ${selectedUf}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm(
      `Restaurar os mapeamentos da UF ${selectedUf} para os padrões do sistema?`,
      'Restaurar Padrão',
      'warning'
    );
    if (!confirmed) return;

    try {
      await resetConfig(selectedUf);
      toast.success(`Configurações da UF ${selectedUf} restauradas!`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao restaurar configurações.');
    }
  };

  const configuredUfs = new Set(configs.map(c => c.uf.toUpperCase()));

  return (
    <Card className="border border-border/70 shadow-sm bg-card rounded-xl overflow-hidden">
      {/* Header minimalista */}
      <CardHeader className="border-b bg-muted/10 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              Configuração de OCR por Estado
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Personalize termos de cabeçalho e estratégias de leitura para a pauta fiscal de cada UF.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{configuredUfs.size} de 27 UFs com regras personalizadas</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Seletor de UF minimalista & Status do Estado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-muted/5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Selecione o Estado (UF)
            </Label>
            <div className="flex items-center gap-2">
              <Select value={selectedUf} onValueChange={setSelectedUf}>
                <SelectTrigger className="w-[180px] h-9 bg-background font-semibold">
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map(uf => {
                    const isConfigured = configuredUfs.has(uf);
                    return (
                      <SelectItem key={uf} value={uf}>
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{uf}</span>
                          {isConfigured && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" title="Regra Personalizada" />
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 flex-1 sm:justify-end">
            <div className="flex flex-col items-start sm:items-end sm:text-right">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Regras para {selectedUf}</span>
                <span
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                    configuredUfs.has(selectedUf)
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {configuredUfs.has(selectedUf) ? 'Personalizado' : 'Padrão do Sistema'}
                </span>
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                {configuredUfs.has(selectedUf)
                  ? 'Este estado utiliza parâmetros customizados salvos.'
                  : 'Este estado utiliza as regras padrões do sistema.'}
              </p>
            </div>

            {isAdmin && configuredUfs.has(selectedUf) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs text-muted-foreground hover:text-destructive h-9 border-dashed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="w-6 h-6 text-primary" />
            <span className="text-xs text-muted-foreground ml-2">Carregando...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Tabs defaultValue="estrategias" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/40 p-1 rounded-lg">
                <TabsTrigger value="estrategias" className="text-xs py-2 flex items-center justify-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Estratégias de Leitura
                </TabsTrigger>
                <TabsTrigger value="sinonimos" className="text-xs py-2 flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Sinônimos de Cabeçalhos
                </TabsTrigger>
              </TabsList>

              {/* Bloco 1: Estratégias de Leitura */}
              <TabsContent value="estrategias" className="space-y-4 focus-visible:outline-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex items-start justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                    <div className="space-y-1 pr-2">
                      <Label className="text-xs font-semibold cursor-pointer">
                        Cortar PDF ao meio em 2 Colunas
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Divide o PDF verticalmente quando possui 2 colunas independentes (ex: SE, RN).
                      </p>
                    </div>
                    <Switch
                      checked={split2Columns}
                      onCheckedChange={setSplit2Columns}
                      disabled={!isAdmin || isSubmitting}
                    />
                  </div>

                  <div className="flex items-start justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                    <div className="space-y-1 pr-2">
                      <Label className="text-xs font-semibold cursor-pointer">
                        Dividir Tabelas Lado a Lado (Grid Duplo)
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Separa tabelas largas de 10+ colunas em 2 tabelas limpas de 5 colunas (ex: MG, MA).
                      </p>
                    </div>
                    <Switch
                      checked={parallelTablesSplit}
                      onCheckedChange={setParallelTablesSplit}
                      disabled={!isAdmin || isSubmitting}
                    />
                  </div>

                  <div className="flex items-start justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                    <div className="space-y-1 pr-2">
                      <Label className="text-xs font-semibold cursor-pointer">
                        Embalagens/Volumes no Cabeçalho (Matriz)
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Lê embalagem/volume dos títulos das colunas de preço (ex: colunas "LATA 350ML" no PR).
                      </p>
                    </div>
                    <Switch
                      checked={matrixHeader}
                      onCheckedChange={setMatrixHeader}
                      disabled={!isAdmin || isSubmitting}
                    />
                  </div>

                  <div className="flex items-start justify-between p-3.5 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                    <div className="space-y-1 pr-2">
                      <Label className="text-xs font-semibold cursor-pointer">
                        Ler Categorias de Subcabeçalhos
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Associa títulos de seções (ex: "(CERVEJAS PURO MALTE)") às linhas de produtos abaixo.
                      </p>
                    </div>
                    <Switch
                      checked={subheaders}
                      onCheckedChange={setSubheaders}
                      disabled={!isAdmin || isSubmitting}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Bloco 2: Mapeamento de Sinônimos */}
              <TabsContent value="sinonimos" className="space-y-4 focus-visible:outline-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="codigoTerms" className="text-xs font-semibold text-muted-foreground">
                      Código / NCM / Item
                    </Label>
                    <Input
                      id="codigoTerms"
                      value={codigoTerms}
                      onChange={e => setCodigoTerms(e.target.value)}
                      disabled={!isAdmin || isSubmitting}
                      placeholder="CODIGO, NCM, ITEM, CHAVE"
                      className="text-xs h-9 bg-background focus:ring-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="descricaoTerms" className="text-xs font-semibold text-muted-foreground">
                      Descrição / Marca do Produto
                    </Label>
                    <Input
                      id="descricaoTerms"
                      value={descricaoTerms}
                      onChange={e => setDescricaoTerms(e.target.value)}
                      disabled={!isAdmin || isSubmitting}
                      placeholder="PRODUTO, MARCA, DESCRICAO"
                      className="text-xs h-9 bg-background focus:ring-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="embalagemTerms" className="text-xs font-semibold text-muted-foreground">
                      Embalagem / Recipiente
                    </Label>
                    <Input
                      id="embalagemTerms"
                      value={embalagemTerms}
                      onChange={e => setEmbalagemTerms(e.target.value)}
                      disabled={!isAdmin || isSubmitting}
                      placeholder="EMBALAGEM, RECIPIENTE, TIPO"
                      className="text-xs h-9 bg-background focus:ring-1"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="volumeTerms" className="text-xs font-semibold text-muted-foreground">
                      Volume / Conteúdo
                    </Label>
                    <Input
                      id="volumeTerms"
                      value={volumeTerms}
                      onChange={e => setVolumeTerms(e.target.value)}
                      disabled={!isAdmin || isSubmitting}
                      placeholder="VOLUME, CAPACIDADE, CONTEUDO"
                      className="text-xs h-9 bg-background focus:ring-1"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="precoTerms" className="text-xs font-semibold text-muted-foreground">
                      Preço / PMPF / Pauta Fiscal
                    </Label>
                    <Input
                      id="precoTerms"
                      value={precoTerms}
                      onChange={e => setPrecoTerms(e.target.value)}
                      disabled={!isAdmin || isSubmitting}
                      placeholder="PMPF, PRECO, PREÇO, VALOR, PAUTA"
                      className="text-xs h-9 bg-background focus:ring-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Ações */}
            {isAdmin && (
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={isSubmitting} size="sm" className="gap-1.5 px-5">
                  {isSubmitting ? <Spinner className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar Mapeamento ({selectedUf})
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}

