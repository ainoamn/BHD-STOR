"use client";

import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "default"
  | "gold"
  | "gradient"
  | "outline"
  | "ghost"
  | "destructive"
  | "link"
  | "secondary";

export type ButtonSize = "sm" | "md" | "lg" | "xl" | "default" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | "default" | "outline" | "ghost" | "destructive" | "link" | "secondary";
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-[#006400] text-white hover:bg-[#004d00] shadow-sm hover:shadow-md",
  gold: "bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#c4a030] shadow-sm hover:shadow-md font-semibold",
  gradient:
    "bg-gradient-to-r from-[#006400] to-[#008000] text-white hover:from-[#004d00] hover:to-[#006400] shadow-md hover:shadow-lg",
  outline:
    "border-2 border-[#006400] text-[#006400] hover:bg-[#006400] hover:text-white bg-transparent",
  ghost: "text-[#006400] hover:bg-[#006400]/10 bg-transparent",
  destructive: "bg-[#C41E3A] text-white hover:bg-[#a01830] shadow-sm",
  link: "text-[#006400] hover:text-[#D4AF37] underline-offset-4 hover:underline bg-transparent shadow-none",
  secondary: "bg-[#F8F5F0] text-[#1a1a1a] hover:bg-[#ece8e0] border border-[#e0dcd6]",
};

const sizeStyles: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg h-9",
  md: "px-5 py-2.5 text-base rounded-xl h-10",
  lg: "px-7 py-3.5 text-lg rounded-xl h-11",
  xl: "px-10 py-4 text-xl rounded-2xl h-12",
  default: "px-5 py-2.5 text-base rounded-xl h-10",
  icon: "h-10 w-10 rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const resolvedSize = size === "default" ? "default" : size;

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 ease-out",
          "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2",
          variantStyles[variant as ButtonVariant] || variantStyles.default,
          sizeStyles[resolvedSize] || sizeStyles.md,
          fullWidth && "w-full",
          isLoading && "cursor-wait",
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2
            className={cn(
              "animate-spin",
              size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : size === "lg" ? "w-5 h-5" : "w-6 h-6"
            )}
          />
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
