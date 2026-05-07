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
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <div className="scanner-core mx-auto" aria-hidden="true">
        <motion.span
          className="scanner-sweep"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
        />
        <span className="scanner-dot" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs uppercase text-slate-400">
          <span>{label}</span>
          <span>{Math.round(safeProgress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-lg border border-cyan-300/20 bg-cyan-950/40">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-300 via-blue-400 to-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${safeProgress}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
