import { motion } from "framer-motion";

type LoadingScannerProps = {
  label?: string;
  progress?: number;
  compact?: boolean;
};

export default function LoadingScanner({
  label = "Scanning localhost...",
  progress = 44,
  compact = false,
}: LoadingScannerProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={compact ? "scanner-module scanner-compact" : "scanner-module"}>
      <div className="scanner-core mx-auto" aria-hidden="true">
        <motion.span
          className="scanner-sweep"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
        />
        <span className="scanner-axis scanner-axis-x" />
        <span className="scanner-axis scanner-axis-y" />
        <span className="scanner-dot" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs uppercase text-slate-400">
          <span>{label}</span>
          <span>{Math.round(safeProgress)}%</span>
        </div>
        <div className="scanner-progress">
          <motion.div
            className="scanner-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${safeProgress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
