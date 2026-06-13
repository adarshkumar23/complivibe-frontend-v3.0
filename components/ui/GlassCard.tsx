"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type GlassCardProps = HTMLMotionProps<"div"> & {
  hover?: boolean;
  strong?: boolean;
  inner?: boolean;
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { className, hover = false, strong = false, inner = false, children, ...props },
  ref
) {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-panel",
        strong ? "cv-glass-strong" : inner ? "cv-glass-subtle" : "cv-glass",
        hover && "transition-shadow duration-300 hover:shadow-glass-hover",
        className
      )}
      {...(hover ? { whileHover: { y: -3 }, transition: { type: "spring", stiffness: 320, damping: 24 } } : {})}
      {...props}
    >
      {children}
    </motion.div>
  );
});
