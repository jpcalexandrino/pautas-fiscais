import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useAlert } from "@/contexts/AlertContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Check, X } from "lucide-react"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { changePassword } = useAuth()
  const { showAlert } = useAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const hasMinLength = formData.newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.newPassword);
  const hasNumber = /[0-9]/.test(formData.newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\/~`\\|';]/.test(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      showAlert("As novas senhas não coincidem", "Erro", "error")
      return
    }

    if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
      showAlert("A nova senha não atende aos requisitos mínimos de segurança", "Erro", "error")
      return
    }

    setLoading(true)
    try {
      await changePassword(formData.currentPassword, formData.newPassword)
      showAlert("Senha alterada com sucesso!", "Sucesso", "success")
      onOpenChange(false)
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      showAlert(error.message, "Erro ao alterar senha", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5" />
            Alterar Senha
          </DialogTitle>
          <DialogDescription>
            Informe sua senha atual e a nova senha que deseja utilizar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
            {formData.newPassword.length > 0 && (
              <div className="text-xs space-y-1.5 mt-2 bg-muted/40 p-3 rounded-lg border border-border/50">
                <p className="font-semibold text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
                  Requisitos de Senha:
                </p>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {hasMinLength ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className={hasMinLength ? "text-green-600 dark:text-green-400" : ""}>
                    No mínimo 8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {hasUppercase ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className={hasUppercase ? "text-green-600 dark:text-green-400" : ""}>
                    Pelo menos uma letra maiúscula
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className={hasNumber ? "text-green-600 dark:text-green-400" : ""}>
                    Pelo menos um número
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  {hasSpecialChar ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span className={hasSpecialChar ? "text-green-600 dark:text-green-400" : ""}>
                    Pelo menos um caractere especial (!, @, #, etc.)
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
