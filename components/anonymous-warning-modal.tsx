"use client"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/lib/i18n-context"

interface AnonymousWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function AnonymousWarningModal({ isOpen, onClose, onConfirm }: AnonymousWarningModalProps) {
  const { t } = useI18n()
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t('title')}
          </DialogTitle>
          <div className="text-muted-foreground text-sm text-left space-y-2">
            <p>{t('description')}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {[0, 1, 2, 3].map((index) => (
                <li key={index}>
                  {t(`limitations.${index}`)}
                </li>
              ))}
            </ul>
            <p className="text-sm font-medium">{t('confirmQuestion')}</p>
          </div>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent">
            {t('buttons.cancel')}
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto">
            {t('buttons.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}