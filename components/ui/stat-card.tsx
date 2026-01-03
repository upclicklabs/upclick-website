"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  stat: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  trend?: "up" | "down";
  variant?: "default" | "highlight" | "warning";
  className?: string;
}

export function StatCard({
  stat,
  label,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variants = {
    default: "bg-white border-gray-100",
    highlight: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
    warning: "bg-gradient-to-br from-red-50 to-orange-50 border-red-100",
  };

  const statColors = {
    default: "text-foreground",
    highlight: "text-blue-600",
    warning: "text-red-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-premium transition-shadow hover:shadow-premium-lg",
        variants[variant],
        className
      )}
    >
      {Icon && (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}

      <div className="flex items-baseline gap-2">
        <span className={cn("text-4xl font-bold", statColors[variant])}>
          {stat}
        </span>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" ? "text-green-600" : "text-red-600"
            )}
          >
            {trend === "up" ? "↑" : "↓"}
          </span>
        )}
      </div>

      <p className="mt-2 font-semibold text-foreground">{label}</p>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function CircularProgress({
  value,
  max = 100,
  label,
  sublabel,
  size = "md",
  color = "hsl(217 91% 60%)",
}: CircularProgressProps) {
  const percentage = (value / max) * 100;
  const sizes = {
    sm: { width: 80, stroke: 6 },
    md: { width: 120, stroke: 8 },
    lg: { width: 160, stroke: 10 },
  };
  const { width, stroke } = sizes[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width, height: width }}>
        <svg className="transform -rotate-90" width={width} height={width}>
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="hsl(210 20% 96%)"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{value}%</span>
        </div>
      </div>
      <p className="mt-3 font-semibold text-foreground text-center">{label}</p>
      {sublabel && (
        <p className="text-sm text-muted-foreground text-center">{sublabel}</p>
      )}
    </motion.div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  maxValue?: number;
}

export function BarChart({ data, title, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-premium"
    >
      {title && (
        <h4 className="mb-6 font-semibold text-foreground">{title}</h4>
      )}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(item.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  backgroundColor: item.color || "hsl(217 91% 60%)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
