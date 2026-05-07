import { motion } from "framer-motion";
import type { ReactNode } from "react";

type HudPanelProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function HudPanel({
  title,
  eyebrow,
  children,
  className = "",
  delay = 0,
}: HudPanelProps) {
  return (
    <motion.section
      className={`glass-panel stark-panel scanline relative overflow-hidden p-5 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      <span className="panel-corner panel-corner-tl" aria-hidden="true" />
      <span className="panel-corner panel-corner-tr" aria-hidden="true" />
      <span className="panel-corner panel-corner-bl" aria-hidden="true" />
      <span className="panel-corner panel-corner-br" aria-hidden="true" />
      {(title || eyebrow) && (
        <div className="relative z-10 mb-5">
          {eyebrow && <p className="hud-eyebrow">{eyebrow}</p>}
          {title && <h2 className="panel-title">{title}</h2>}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.section>
  );
}
