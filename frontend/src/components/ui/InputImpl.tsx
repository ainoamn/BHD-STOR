"use client";

import React, { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*                               Input                                 */
/* ------------------------------------------------------------------ */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      type = "text",
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-[#1a1a1a] dark:text-gray-200">
            {label}
            {props.required && <span className="text-[#C41E3A] mr-1">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 peer-focus:text-[#D4AF37] transition-colors rtl:right-0 rtl:left-auto rtl:pr-3 rtl:pl-0">
              {leftIcon}
            </div>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            type={inputType}
            disabled={disabled}
            className={cn(
              "flex w-full rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 text-sm",
              "text-[#1a1a1a] dark:text-white placeholder:text-gray-400",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
              "border-gray-200 dark:border-gray-700",
              error && "border-[#C41E3A] focus:border-[#C41E3A] focus:ring-[#C41E3A]/20",
              leftIcon && "pl-10 rtl:pr-10 rtl:pl-4",
              (rightIcon || isPassword) && "pr-10 rtl:pl-10 rtl:pr-4",
              className
            )}
            {...props}
          />

          {/* Right Icon / Password Toggle */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            )}
            {!isPassword && rightIcon && (
              <span className="text-gray-400">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1.5 text-[#C41E3A] text-xs animate-in slide-in-from-top-1">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ------------------------------------------------------------------ */
/*                            Textarea                                 */
/* ------------------------------------------------------------------ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-[#1a1a1a] dark:text-gray-200">
            {label}
            {props.required && <span className="text-[#C41E3A] mr-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex w-full rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 text-sm min-h-[100px] resize-y",
            "text-[#1a1a1a] dark:text-white placeholder:text-gray-400",
            "transition-all duration-200 ease-out",
            "focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "border-gray-200 dark:border-gray-700",
            error && "border-[#C41E3A] focus:border-[#C41E3A] focus:ring-[#C41E3A]/20",
            className
          )}
          {...props}
        />

        {error && (
          <div className="flex items-center gap-1.5 text-[#C41E3A] text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

/* ------------------------------------------------------------------ */
/*                          Select Input                               */
/* ------------------------------------------------------------------ */

interface SelectOption {
  value: string;
  label: string;
  labelAr?: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      onChange,
      fullWidth = false,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full", containerClassName)}>
        {label && (
          <label className="text-sm font-medium text-[#1a1a1a] dark:text-gray-200">
            {label}
            {props.required && <span className="text-[#C41E3A] mr-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
              "flex w-full rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 text-sm appearance-none",
              "text-[#1a1a1a] dark:text-white",
              "transition-all duration-200 ease-out",
              "focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-gray-200 dark:border-gray-700 pr-10",
              error && "border-[#C41E3A] focus:border-[#C41E3A] focus:ring-[#C41E3A]/20",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.labelAr || opt.label}
              </option>
            ))}
          </select>

          {/* Chevron */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none rtl:left-0 rtl:right-auto rtl:pl-3 rtl:pr-0">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-[#C41E3A] text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {helperText && !error && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Input, Textarea, Select };
