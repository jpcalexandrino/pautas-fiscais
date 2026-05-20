import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface AlertConfig {
  isOpen: boolean;
  title: string;
  message: ReactNode | string;
  type: 'info' | 'success' | 'warning' | 'error';
  isConfirm: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface AlertContextType {
  showAlert: (message: ReactNode | string, title?: string, type?: AlertConfig['type']) => Promise<boolean>;
  showConfirm: (message: ReactNode | string, title?: string, type?: AlertConfig['type']) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    isConfirm: false,
    resolve: null,
  });

  const showAlert = useCallback((message: ReactNode | string, title = 'Aviso', type: AlertConfig['type'] = 'info') => {
    return new Promise<boolean>((resolve) => {
      setAlertConfig({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: false,
        resolve,
      });
    });
  }, []);

  const showConfirm = useCallback((message: ReactNode | string, title = 'Confirmação', type: AlertConfig['type'] = 'warning') => {
    return new Promise<boolean>((resolve) => {
      setAlertConfig({
        isOpen: true,
        title,
        message,
        type,
        isConfirm: true,
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    const { resolve } = alertConfig;
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
    if (resolve) resolve(true);
  };

  const handleCancel = () => {
    const { resolve } = alertConfig;
    setAlertConfig((prev) => ({ ...prev, isOpen: false }));
    if (resolve) resolve(false);
  };

  const getTypeStyles = () => {
    switch (alertConfig.type) {
      case 'error': return 'text-destructive';
      case 'warning': return 'text-amber-500';
      case 'success': return 'text-emerald-500';
      default: return 'text-primary';
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={alertConfig.isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={getTypeStyles()}>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {typeof alertConfig.message === 'string' ? (
                <p className="text-sm text-balance text-muted-foreground md:text-pretty">
                  {alertConfig.message}
                </p>
              ) : (
                <div className="text-sm text-muted-foreground w-full">
                  {alertConfig.message}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertConfig.isConfirm && (
              <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(alertConfig.type === 'error' && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
            >
              {alertConfig.isConfirm ? 'Confirmar' : 'Ok'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
