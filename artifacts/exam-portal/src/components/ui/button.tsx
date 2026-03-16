import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none active:scale-95";
    
    const variants = {
      default: "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5",
      destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 hover:shadow-destructive/30",
      outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "underline-offset-4 hover:underline text-primary",
    };

    const sizes = {
      default: "h-11 py-2 px-6",
      sm: "h-9 px-4 rounded-lg",
      lg: "h-14 px-8 rounded-2xl text-base",
      icon: "h-11 w-11 rounded-full",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
