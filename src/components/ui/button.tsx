"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--gl-radius)] border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Flat, rectilinear, one accent. Matches .greenlist-primary-button so a
        // hand-rolled link and a <Button> never look like different systems.
        // Dark ink foreground: white on --gl-accent is ~3.0:1, below AA for
        // 0.875rem text; --gl-accent-ink clears 4.5:1 in both states.
        default:
          "border-[var(--gl-accent)] bg-[var(--gl-accent)] text-[var(--gl-accent-ink)] hover:border-[#45963a] hover:bg-[#45963a] hover:text-[var(--gl-accent-ink)]",
        destructive:
          "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border-[var(--gl-border-strong)] bg-transparent text-foreground hover:border-[var(--gl-text-muted)] hover:bg-[var(--gl-surface-raised)]",
        secondary:
          "border-[var(--gl-border)] bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent text-foreground hover:bg-[var(--gl-surface-raised)]",
        link: "border-transparent text-foreground underline underline-offset-4 hover:text-[var(--gl-accent-strong)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
