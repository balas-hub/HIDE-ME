import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import HomeDecoder from './pages/HomeDecoder';
import EncoderPage from './pages/EncoderPage';
import VaultPage from './pages/VaultPage';
import CyberStatsHUD from './components/CyberStatsHUD';
import { Lock, ShieldCheck, ShieldAlert } from 'lucide-react';

function MainLayout() {
  const [activeTab, setActiveTab] = useState('decoder');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col space-bg text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Real-time Cyber Telemetry & Statistics HUD */}
        <CyberStatsHUD />

        {activeTab === 'decoder' && <HomeDecoder />}
        {activeTab === 'encoder' && (
          <EncoderPage onNavigateToVault={() => setActiveTab('vault')} />
        )}
        {activeTab === 'vault' && (
          <VaultPage
            onNavigateToEncoder={() => setActiveTab('encoder')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}
      </main>

      {/* Sovereign Shield Footer */}
      <footer className="border-t border-cyan-500/20 bg-[#020714]/95 py-8 mt-12 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Hide Me Sovereign Shield"
              className="w-8 h-8 object-contain shield-glow"
            />
            <div>
              <p className="font-bold text-white tracking-wide">Hide Me &bull; Sovereign Defense</p>
              <p className="text-[11px] text-slate-400">Payloads buried beyond forensic recovery. Zero trace. Zero compromise.</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-300">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#030e26] border border-cyan-500/30">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-300 font-bold">AES-256 ARMORED</span>
            </span>
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#030e26] border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-bold">100% BIT-PARITY SEAL</span>
            </span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
