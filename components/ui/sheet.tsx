"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50 animate-in fade-in-0"
            onClick={() => onOpenChange(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-background border-l shadow-lg animate-in slide-in-from-right">
            {children}
          </div>
        </div>
      )}
    </>
  )
}

function SheetContent({ className, children, onClose }: { className?: string; children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-4 py-4 border-b", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

export { Sheet, SheetContent, SheetHeader, SheetTitle }
