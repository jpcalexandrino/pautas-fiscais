import React from 'react';
import { Receipt, Zap, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatKWh, formatNumber } from '@shared/utils/formatters';

interface DataStatsProps {
  resumo: {
    totalFaturas: number;
    valorTotal: number;
    mediaValor: number;
    consumoTotal: number;
    mediaConsumo: number;
    totalTributos: number;
  };
}

export const DataStats: React.FC<DataStatsProps> = ({ resumo }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resumo.totalFaturas}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{formatCurrency(resumo.valorTotal)}</div>
          <p className="text-xs text-muted-foreground">Média: {formatCurrency(resumo.mediaValor)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{formatKWh(resumo.consumoTotal)}</div>
          <p className="text-xs text-muted-foreground">Média: {formatKWh(resumo.mediaConsumo)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tributos</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums">{formatCurrency(resumo.totalTributos)}</div>
          <p className="text-xs text-muted-foreground">
            {resumo.valorTotal > 0 ? formatNumber((resumo.totalTributos / resumo.valorTotal) * 100) : '0'}% do total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
