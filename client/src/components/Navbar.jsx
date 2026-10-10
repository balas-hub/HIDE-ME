import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AgentAvatar from './AgentAvatar';
import {
  EyeOff, Shield, Lock, FolderKey, LogIn, LogOut,
  UserCheck, ShieldCheck, CheckCircle2, X
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth, onOpenProfile }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#05070e]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            {/* Brand Logo */}
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setActiveTab('decoder')}
            >
              <div className="relative flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Hide Me Sovereign Shield"
                  className="w-11 h-11 object-contain shield-glow"
                />
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  Hide <span className="text-cyan-400">Me</span>
                </span>
                <p className="text-[10px] text-cyan-400/90 font-mono tracking-wider uppercase hidden sm:block">
                  Sovereign Steganography
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center space-x-1 bg-[#030919] p-1.5 rounded-xl border border-cyan-500/30">
              <button
                onClick={() => setActiveTab('decoder')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'decoder'
                    ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Extract Payload</span>
              </button>

              <button
                onClick={() => setActiveTab('encoder')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'encoder'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-md shadow-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Bury Payload</span>
              </button>

              <button
                onClick={() => setActiveTab('vault')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'vault'
                    ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderKey className="w-4 h-4" />
                <span>Classified Vault</span>
              </button>
            </nav>

            {/* Right Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSecurityModal(true)}
                title="Sovereign Shield Specifications"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#030e26] text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>AES-256 DEFENSE</span>
              </button>

              {!isAuthenticated ? (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-sm font-bold bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>IDENTIFY</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={onOpenProfile}
                    title="Inspect & Edit Agent Dossier"
                    className="flex items-center space-x-2.5 bg-[#030e26] pl-2 pr-3 py-1.5 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all group"
                  >
                    <AgentAvatar
                      avatar={user?.avatar}
                      frameStyle={user?.frameStyle || 'shield_reticle'}
                      size="sm"
                    />
                    <div className="text-left hidden sm:block">
                      <span className="text-xs font-mono font-bold text-cyan-200 block group-hover:text-cyan-300">
                        {user?.callsign || user?.username}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-400/80 block uppercase">
                        {user?.badge || 'LVL 1'} &bull; {user?.operationsCount || 0} OPS
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={logout}
                    title="Terminate Session"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-cyan-500/20 text-xs font-mono">
            <button
              onClick={() => setActiveTab('decoder')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'decoder' ? 'text-cyan-400 font-bold bg-white/5' : 'text-slate-400'
              }`}
            >
              Extract
            </button>
            <button
              onClick={() => setActiveTab('encoder')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'encoder' ? 'text-cyan-400 font-bold bg-white/5' : 'text-slate-400'
              }`}
            >
              Bury
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`px-3 py-1 rounded-md ${
                activeTab === 'vault' ? 'text-emerald-400 font-bold bg-white/5' : 'text-slate-400'
              }`}
            >
              Vault
            </button>
          </div>
        </div>
      </header>

      {/* Security Info Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#030a1c] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative font-mono">
            <button
              onClick={() => setShowSecurityModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3 mb-5">
              <img
                src="/logo.png"
                alt="Sovereign Shield"
                className="w-10 h-10 object-contain shield-glow"
              />
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">SOVEREIGN DEFENSE SPEC</h3>
                <p className="text-xs text-cyan-400">Why adversaries fail against Hide Me</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-[#020712] border border-cyan-500/20 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">AES-256-CBC Military Armor</strong>
                  <span className="text-slate-400">
                    2<sup>256</sup> keys. Supercomputers will burn out before guessing 0.0000001% of the keyspace. Plaintext never touches disk unencrypted.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020712] border border-cyan-500/20 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Sub-Zero Spectral Footprint</strong>
                  <span className="text-slate-400">
                    Bytes dissolve directly into host carrier entropy. Video, audio, PDFs, and Office docs remain bit-for-bit indistinguishable from organic noise.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020712] border border-cyan-500/20 flex items-start space-x-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold">Zero-Tolerance Parity Seal</strong>
                  <span className="text-slate-400">
                    Cryptographic delimiters and headers ensure corruptions or adversary tampering cause instant failure. Zero data leak.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-cyan-500/20 flex justify-end">
              <button
                onClick={() => setShowSecurityModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black tracking-wider uppercase transition-colors"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
