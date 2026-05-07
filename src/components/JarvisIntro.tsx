import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { SystemInfo } from "../types/systemInfo";
import LoadingScanner from "./LoadingScanner";

type JarvisIntroProps = {
  systemInfo: SystemInfo;
  demoMode: boolean;
  onComplete: () => void;
};

export default function JarvisIntro({ systemInfo, demoMode, onComplete }: JarvisIntroProps) {
  const deviceName = systemInfo.deviceName?.trim() || "Operator";
  const welcomeText = useMemo(() => `Welcome to J.A.R.V.I.S, ${deviceName}.`, [deviceName]);
  const [typedText, setTypedText] = useState("");
  const bootChecks = [
    "Bridge signature verified",
    "Local telemetry sealed",
    "Operator profile mapped",
    "HUD compositor online",
  ];

  useEffect(() => {
    setTypedText("");
    let cursor = 0;
    let completeTimer: number | undefined;
    const interval = window.setInterval(() => {
      cursor += 1;
      setTypedText(welcomeText.slice(0, cursor));
      if (cursor >= welcomeText.length) {
        window.clearInterval(interval);
        completeTimer = window.setTimeout(onComplete, 1550);
      }
    }, 44);

    return () => {
      window.clearInterval(interval);
      if (completeTimer) {
        window.clearTimeout(completeTimer);
      }
    };
  }, [onComplete, welcomeText]);

  return (
    <motion.main
      className="jarvis-screen flex min-h-screen items-center justify-center px-5 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="hud-grid absolute inset-0" aria-hidden="true" />
      <div className="cinematic-vignette" aria-hidden="true" />
      <section className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[0.86fr_1.14fr]">
        <motion.div
          className="mx-auto h-72 w-72 max-w-[72vw] sm:h-80 sm:w-80"
          initial={{ scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          aria-hidden="true"
        >
          <div className="intro-reactor">
            <span className="intro-ring intro-ring-a" />
            <span className="intro-ring intro-ring-b" />
            <span className="intro-ring intro-ring-c" />
            <span className="intro-ring intro-ring-d" />
            <span className="intro-core" />
          </div>
        </motion.div>

        <div className="text-center lg:text-left">
          <motion.p
            className="hud-eyebrow justify-center lg:justify-start"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {demoMode ? "Demo Runtime" : "Local Bridge Handshake"}
          </motion.p>
          <h1 className="mt-5 min-h-32 text-balance text-4xl font-semibold leading-tight text-slate-50 sm:text-6xl">
            {typedText}
            <span className="type-caret" aria-hidden="true" />
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Personalization is loaded from the Local Bridge response only. No browser-only device
            fingerprinting is used.
          </p>

          <motion.div
            className="mt-7 grid gap-3 sm:grid-cols-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.45 } },
            }}
          >
            {bootChecks.map((check) => (
              <motion.div
                key={check}
                className="boot-check"
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <span aria-hidden="true" />
                {check}
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 max-w-md">
            <LoadingScanner label="Calibrating interface..." progress={88} compact />
          </div>
        </div>
      </section>
    </motion.main>
  );
}
