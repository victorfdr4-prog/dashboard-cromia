import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { strong?: boolean }
>(({ className, strong, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      strong ? "glass-strong" : "glass",
      "rounded-2xl shadow-lg shadow-black/40",
      className,
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";
