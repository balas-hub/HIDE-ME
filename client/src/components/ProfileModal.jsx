import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AgentAvatar, { AGENT_AVATAR_PRESETS, SECRET_AGENT_FRAMES } from './AgentAvatar';
import {
  X, ShieldCheck, Check, Upload, Terminal, AlertCircle,
  Sparkles, User, BadgeAlert, Lock, Zap, ShieldAlert, Award
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [callsign, setCallsign] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [frameStyle, setFrameStyle] = useState('shield_reticle');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Operations and Level Progression Data
  const operationsCount = user?.operationsCount || 0;
  const levelNumber = user?.levelNumber || (
    operationsCount >= 15 ? 5 :
    operationsCount >= 9 ? 4 :
    operationsCount >= 5 ? 3 :
    operationsCount >= 2 ? 2 : 1
  );

  const levelThresholds = [0, 2, 5, 9, 15];
  const nextLevelAt = user?.nextLevelAt ?? (levelNumber < 5 ? levelThresholds[levelNumber] : null);
  const prevLevelAt = levelThresholds[levelNumber - 1] || 0;

  let progressPct = 100;
  let opsRemaining = 0;
  if (levelNumber < 5 && nextLevelAt !== null) {
    opsRemaining = Math.max(0, nextLevelAt - operationsCount);
    const range = nextLevelAt - prevLevelAt;
    const currentInRange = operationsCount - prevLevelAt;
    progressPct = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
  }

  // Sync state with current user when opened
  useEffect(() => {
    if (user && isOpen) {
      setCallsign(user.callsign || user.username || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      
      const ops = user.operationsCount || 0;
      const isCurrentUnlocked = SECRET_AGENT_FRAMES.some(
        f => f.id === user.frameStyle && ops >= f.requiredOps
      );
      setFrameStyle(isCurrentUnlocked ? user.frameStyle : 'shield_reticle');
      setError('');
      setSuccessMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('INVALID FILE: Biometric picture must be an image (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('FILE TOO LARGE: Biometric photo exceeds 3 MB limit. Compress or crop before upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read biometric image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetUrl) => {
    setAvatar(presetUrl);
    setError('');
  };

  const handleFrameClick = (frame) => {
    const isUnlocked = operationsCount >= frame.requiredOps;
    if (!isUnlocked) {
      const remaining = frame.requiredOps - operationsCount;
      setError(
        `ACCESS DENIED: Frame '${frame.name}' requires Level ${frame.requiredLevel} (${frame.requiredOps} operations). You currently have ${operationsCount}. Complete ${remaining} more operation${remaining > 1 ? 's' : ''} to unlock.`
      );
      return;
    }
    setError('');
    setFrameStyle(frame.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const ops = operationsCount;
      const isSelectedUnlocked = SECRET_AGENT_FRAMES.some(
        f => f.id === frameStyle && ops >= f.requiredOps
      );
      const safeFrame = isSelectedUnlocked ? frameStyle : 'shield_reticle';

      await updateProfile({
        callsign,
        bio,
        avatar,
        frameStyle: safeFrame
      });

      setSuccessMsg('AGENT DOSSIER LOCKED & SECURED. Biometric identity and tactical frame updated across all systems.');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'DOSSIER UPDATE REJECTED: Server encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md font-mono overflow-y-auto">
      <div className="bg-[#030919] border-2 border-cyan-500/40 rounded-2xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative shadow-cyan-950/60 my-6 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-cyan-500/30">
          <div className="w-10 h-10 rounded-xl bg-[#030e26] border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wider">
              AGENT DOSSIER &amp; SECRET AGENT FRAMES
            </h2>
            <p className="text-xs text-cyan-400">
              Clearance ranks and classified frames unlock strictly by executing operations
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* CLEARANCE PROGRESSION HUD                                      */}
        {/* ============================================================== */}
        <div className="mb-6 p-4 rounded-xl bg-[#020712] border border-cyan-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-extrabold text-xs tracking-wider uppercase">
                {user?.badge || `LVL ${levelNumber}`}
              </span>
              <span className="text-sm font-extrabold text-white uppercase tracking-wide">
                {user?.clearanceLevel || 'LEVEL 1 - ROOKIE INFILTRATOR'}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-300 font-bold">
              <span className="text-cyan-400">
                {operationsCount} OPERATION{operationsCount === 1 ? '' : 'S'}
              </span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-emerald-400">
                {user?.xp || 0} XP
              </span>
            </div>
          </div>

          {/* Progression Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400 uppercase">
                {levelNumber < 5
                  ? `Clearance Progress to Level ${levelNumber + 1}`
                  : 'Maximum Sovereign Clearance'}
              </span>
              <span className="text-cyan-400 font-bold">
                {levelNumber < 5
                  ? `${operationsCount} / ${nextLevelAt} Ops (${progressPct}%)`
                  : '100% MAXIMUM RANK'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#030e26] rounded-full overflow-hidden border border-cyan-500/30">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Level Guidance Banner */}
          <div className="text-[11px] text-cyan-300/90 flex items-center space-x-1.5 pt-0.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>
              {levelNumber < 5 ? (
                <>
                  Execute <strong className="text-white">{opsRemaining}</strong> more carrier operation{opsRemaining === 1 ? '' : 's'} (burying or extracting payloads) to unlock Level {levelNumber + 1} and the next secret agent frame!
                </>
              ) : (
                <>
                  All 5 secret agent frames unlocked. Sovereign command privileges fully active.
                </>
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Live Preview & Avatar Photo Controls */}
          <div className="bg-[#020712] p-4 sm:p-5 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-5">
            {/* Live Framed Avatar Preview */}
            <div className="flex flex-col items-center space-y-2 flex-shrink-0">
              <AgentAvatar
                avatar={avatar}
                frameStyle={frameStyle}
                size="lg"
                showBadge={true}
                clearanceLevel={user?.badge || `LVL ${levelNumber}`}
              />
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-1">
                LIVE HUD PREVIEW
              </span>
            </div>

            {/* Photo Upload & Presets */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  BIOMETRIC IDENTITY PHOTO
                </span>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="text-[11px] text-red-400 hover:text-red-300 underline"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              {/* Upload Button */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#030e26] hover:bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>UPLOAD CUSTOM PHOTO (.JPG / .PNG)</span>
                </button>
              </div>

              {/* Preset Operative Avatars */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1.5 uppercase">
                  OR CHOOSE TACTICAL OPERATIVE PRESET:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {AGENT_AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.url)}
                      title={p.name}
                      className={`p-1.5 rounded-lg border flex flex-col items-center space-y-1 transition-all ${
                        avatar === p.url
                          ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                          : 'border-white/10 hover:border-cyan-500/40 bg-[#030919]'
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-8 h-8 rounded object-cover" />
                      <span className="text-[9px] text-slate-300 truncate w-full text-center">
                        {p.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECRET AGENT FRAME SELECTOR WITH LEVEL LOCKING                 */}
          {/* ============================================================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>SECRET AGENT FRAMES</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Unlocked via missions
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SECRET_AGENT_FRAMES.map((f) => {
                const isUnlocked = operationsCount >= f.requiredOps;
                const isSelected = frameStyle === f.id;
                const opsNeeded = f.requiredOps - operationsCount;

                return (
                  <div
                    key={f.id}
                    onClick={() => handleFrameClick(f)}
                    className={`p-3 rounded-xl border transition-all flex items-start space-x-3 select-none ${
                      isUnlocked
                        ? isSelected
                          ? 'border-cyan-400 bg-[#020e26] shadow-[0_0_12px_rgba(0,229,255,0.35)] cursor-pointer ring-1 ring-cyan-400'
                          : 'border-cyan-500/30 hover:border-cyan-400/60 bg-[#020712] cursor-pointer'
                        : 'border-slate-800/80 bg-[#02040b] opacity-65 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <AgentAvatar
                        avatar={avatar}
                        frameStyle={f.id}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{f.name}</span>
                        {isUnlocked ? (
                          isSelected && (
                            <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          )
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {f.description}
                      </p>

                      {/* Unlock Status Chip */}
                      <div className="mt-1.5">
                        {isUnlocked ? (
                          <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 inline-block">
                            ✓ UNLOCKED &bull; {f.badge}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 inline-block">
                            🔒 REQUIRES {f.requiredOps} OPS ({opsNeeded} MORE)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* AGENT DOSSIER DETAILS                                          */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase">
                AGENT CALLSIGN / CODENAME
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  placeholder="e.g. Ghost-07"
                  className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase">
                EARNED CLEARANCE RANK
              </label>
              <div className="relative">
                <BadgeAlert className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
                <div className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-cyan-300 font-bold truncate flex items-center">
                  <span>{user?.clearanceLevel || 'LEVEL 1 - ROOKIE INFILTRATOR'}</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-500 block mt-1">
                Calculated strictly by operational carrier execution
              </span>
            </div>
          </div>

          {/* Operational Dossier Notes (Bio) */}
          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase">
              OPERATIONAL DOSSIER SUMMARY (BIO)
            </label>
            <textarea
              rows={2}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Specialized in deep steganographic injection and sovereign radar evasion..."
              className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl p-3 text-xs text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
            <span className="text-[10px] text-slate-500 float-right">
              {bio.length}/280 chars
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 text-xs font-bold uppercase transition-colors"
            >
              DISMISS
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/30 transition-all flex items-center space-x-2"
            >
              <span>{loading ? 'LOCKING DOSSIER...' : 'LOCK IN AGENT DOSSIER'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
