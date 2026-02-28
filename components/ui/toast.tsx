'use client'

import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-4 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]',
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-5 pr-12 shadow-xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground shadow-md',
        success: 'border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white text-green-900 shadow-lg',
        destructive:
          'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white text-red-900 shadow-lg',
        warning: 'border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-white text-yellow-900 shadow-lg',
        info: 'border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white text-blue-900 shadow-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const ToastIcon = ({ variant }: { variant?: 'default' | 'success' | 'destructive' | 'warning' | 'info' | null }) => {
  const safeVariant = variant || 'default'
  switch (safeVariant) {
    case 'success':
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 shadow-sm">
          <CheckCircle className="h-6 w-6 text-green-600" strokeWidth={2.5} />
        </div>
      )
    case 'destructive':
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 shadow-sm">
          <AlertCircle className="h-6 w-6 text-red-600" strokeWidth={2.5} />
        </div>
      )
    case 'warning':
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 shadow-sm">
          <AlertTriangle className="h-6 w-6 text-yellow-600" strokeWidth={2.5} />
        </div>
      )
    case 'info':
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 shadow-sm">
          <Info className="h-6 w-6 text-blue-600" strokeWidth={2.5} />
        </div>
      )
    default:
      return (
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 shadow-sm">
          <Info className="h-6 w-6 text-blue-600" strokeWidth={2.5} />
        </div>
      )
  }
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

interface ToastWithIconProps {
  className?: string
  variant?: VariantProps<typeof toastVariants>['variant']
  title?: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const ToastWithIcon = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  ToastWithIconProps
>(({ className, variant, title, description, children, ...props }, ref) => {
  return (
    <Toast ref={ref} variant={variant} className={cn("gap-4", className)} {...props}>
      <div className="flex-shrink-0">
        <ToastIcon variant={variant} />
      </div>
      <div className="flex-1 space-y-1">
        {title && <ToastTitle className="font-bold text-base">{title}</ToastTitle>}
        {description && <ToastDescription className="text-sm">{description}</ToastDescription>}
      </div>
      <ToastClose />
      {children}
    </Toast>
  )
})
ToastWithIcon.displayName = "ToastWithIcon"

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
      className,
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'absolute right-3 top-3 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-5 w-5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm opacity-90', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

export type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastWithIcon,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
