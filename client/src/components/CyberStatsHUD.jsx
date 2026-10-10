import React, { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Radio, Lock, Activity, EyeOff, Terminal } from 'lucide-react';

export default function CyberStatsHUD() {
  const [latency, setLatency] = useState(3.4);
  const [entropyDelta, setEntropyDelta] = useState(0.00018);
  const [activeCarriersCount, setActiveCarriersCount] = useState(142);

  // Subtle real-time fluctuating telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => parseFloat((3.1 + Math.random() * 0.8).toFixed(1)));
      setEntropyDelta((prev) => parseFloat((0.00014 + Math.random() * 0.00008).toFixed(5)));
      setActiveCarriersCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full mb-8">
      {/* Top Threat & Supremacy Ticker */}
      <div className="flex items-center justify-between px-4 py-2 rounded-t-xl bg-[#030e26] border-t border-x border-cyan-500/30 text-[11px] font-mono text-cyan-300">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span className="font-bold tracking-wider text-cyan-400 uppercase">
            SOVEREIGN DEFENSE GRID: ENGAGED
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">
            Adversary interception probability: <span className="text-emerald-400 font-bold">0.00000%</span>
          </span>
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <span className="hidden md:inline">
            ENTROPY DELTA: <span className="text-cyan-300">&Delta; {entropyDelta}</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <Zap className="w-3 h-3" />
            <span>{latency}ms LATENCY</span>
          </span>
        </div>
      </div>

      {/* Cyber Grid Metrics */}
      <div className="telemetry-hud rounded-b-xl p-4 sm:p-5 border-b border-x border-cyan-500/30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
          {/* Stat 1 */}
          <div className="bg-[#030919] p-3 rounded-lg border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/60 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider mb-1">
              <span>Surveillance Evasion</span>
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-cyan-300 tracking-tight">
              100.0%
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">
              [IMPERVIOUS TO FORENSICS]
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-[#030919] p-3 rounded-lg border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/60 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider mb-1">
              <span>Detection Probability</span>
              <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              0.0000%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              [STATISTICALLY INVISIBLE]
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-[#030919] p-3 rounded-lg border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/60 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider mb-1">
              <span>Cryptographic Armor</span>
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-indigo-300 tracking-tight">
              2<sup>256</sup> KEYS
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              [QUANTUM RESISTANT AES]
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-[#030919] p-3 rounded-lg border border-cyan-500/20 relative overflow-hidden group hover:border-cyan-400/60 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase tracking-wider mb-1">
              <span>Carrier Bit Integrity</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-cyan-400 tracking-tight">
              100% BIT-PERFECT
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              [ZERO NOISE ARTIFACTS]
            </div>
          </div>
        </div>

        {/* Arrogant Directive Banner */}
        <div className="mt-3.5 pt-3 border-t border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">
              <strong className="text-cyan-400">DOCTRINE:</strong> Plaintext is an invitation for surveillance. If your message matters, bury it.
            </span>
          </div>
          <div className="text-[10px] text-cyan-500 font-semibold tracking-wide uppercase">
            [ZERO COMPROMISE &bull; ZERO TRACE]
          </div>
        </div>
      </div>
    </div>
  );
}
