import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  /** Hide wordmark below `sm` breakpoint (header compact mode). */
  wordmarkHiddenOnMobile?: boolean;
  brandLabel?: string;
  priority?: boolean;
};

/**
 * BHD Oman brand mark — circular icon + optional text label.
 */
export function BrandLogo({
  className,
  size = 36,
  showWordmark = false,
  wordmarkHiddenOnMobile = false,
  brandLabel,
  priority = false,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo-icon.png"
        alt="BHD Oman"
        width={size}
        height={size}
        priority={priority}
        className="rounded-full object-contain shrink-0"
      />
      {showWordmark && brandLabel ? (
        <span
          className={cn(
            "font-bold text-lg sm:text-xl tracking-tight text-foreground",
            wordmarkHiddenOnMobile && "hidden sm:inline",
          )}
        >
          {brandLabel}
        </span>
      ) : null}
    </span>
  );
}
