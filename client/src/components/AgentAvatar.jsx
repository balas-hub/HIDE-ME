import React from 'react';

// Preset tactical avatars if user selects one
export const AGENT_AVATAR_PRESETS = [
  {
    id: 'preset_ghost',
    name: 'Sovereign Ghost',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23020b1e"/><circle cx="50" cy="38" r="20" fill="%2300e5ff" opacity="0.85"/><path d="M22 84 C22 58, 78 58, 78 84 Z" fill="%2300b4d8"/><path d="M40 36 L44 36 M56 36 L60 36" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round"/><path d="M36 34 Q50 44 64 34" stroke="%23002b49" stroke-width="2" fill="none"/></svg>'
  },
  {
    id: 'preset_cipher',
    name: 'Cipher Enforcer',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230a1128"/><circle cx="50" cy="38" r="20" fill="%238b5cf6" opacity="0.85"/><path d="M22 84 C22 58, 78 58, 78 84 Z" fill="%236366f1"/><rect x="38" y="34" width="24" height="6" rx="3" fill="%2300e5ff"/><circle cx="50" cy="37" r="1.5" fill="%23ffffff"/></svg>'
  },
  {
    id: 'preset_infiltrator',
    name: 'Shadow Infiltrator',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23020617"/><circle cx="50" cy="38" r="20" fill="%230284c7" opacity="0.8"/><path d="M20 86 C20 56, 80 56, 80 86 Z" fill="%230369a1"/><polygon points="42,35 48,32 52,32 58,35 55,40 45,40" fill="%2338bdf8"/><circle cx="50" cy="36" r="2" fill="%23ffffff"/></svg>'
  },
  {
    id: 'preset_apex',
    name: 'Apex Recon',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23051329"/><circle cx="50" cy="38" r="20" fill="%2310b981" opacity="0.85"/><path d="M22 84 C22 58, 78 58, 78 84 Z" fill="%23059669"/><rect x="36" y="33" width="28" height="8" rx="2" fill="%2300e5ff"/><line x1="50" y1="33" x2="50" y2="41" stroke="%23051329" stroke-width="1.5"/></svg>'
  }
];

export const SECRET_AGENT_FRAMES = [
  {
    id: 'shield_reticle',
    name: 'Sovereign Shield Reticle',
    description: 'Electric cyan radar brackets hugging corner curves with target lock ticks.',
    badge: 'LVL 1',
    requiredLevel: 1,
    requiredOps: 0,
    levelName: 'ROOKIE INFILTRATOR'
  },
  {
    id: 'phantom_matrix',
    name: 'Phantom Operative Hex',
    description: 'Chiseled cyber-hex armor with scanning laser pulse.',
    badge: 'LVL 2',
    requiredLevel: 2,
    requiredOps: 2,
    levelName: 'CIPHER SPECIALIST'
  },
  {
    id: 'recon_hud',
    name: 'Recon Stealth Crosshair',
    description: 'Long-range surveillance crosshairs and azimuth telemetry ticks.',
    badge: 'LVL 3',
    requiredLevel: 3,
    requiredOps: 5,
    levelName: 'SHADOW ANALYST'
  },
  {
    id: 'cipher_ring',
    name: 'Black Ops Aperture',
    description: 'Rotating dashed biometric lens shutter with 4 iris nodes.',
    badge: 'LVL 4',
    requiredLevel: 4,
    requiredOps: 9,
    levelName: 'BLACK OPS ENFORCER'
  },
  {
    id: 'apex_enforcer',
    name: 'Quantum Apex Enforcer',
    description: 'High-voltage sovereign armor with hazard power nodes.',
    badge: 'LVL 5',
    requiredLevel: 5,
    requiredOps: 15,
    levelName: 'SOVEREIGN APEX OPERATIVE'
  }
];

export default function AgentAvatar({
  avatar = '',
  frameStyle = 'shield_reticle',
  size = 'md',
  showBadge = false,
  clearanceLevel = 'LVL 1',
  className = ''
}) {
  const sizeMap = {
    sm: {
      box: 'w-10 h-10',
      badge: 'text-[7px] px-1 -bottom-1'
    },
    md: {
      box: 'w-16 h-16',
      badge: 'text-[8px] px-1.5 -bottom-1'
    },
    lg: {
      box: 'w-24 h-24',
      badge: 'text-[10px] px-2 -bottom-1.5'
    },
    xl: {
      box: 'w-32 h-32',
      badge: 'text-xs px-2.5 -bottom-2'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const avatarSource = avatar || AGENT_AVATAR_PRESETS[0].url;

  // Geometry configuration per frame style
  const isCircular = frameStyle === 'cipher_ring' || frameStyle === 'recon_hud';
  const isHex = frameStyle === 'phantom_matrix';
  const hexClipStyle = isHex
    ? { clipPath: 'polygon(14% 0%, 86% 0%, 100% 14%, 100% 86%, 86% 100%, 14% 100%, 0% 86%, 0% 14%)' }
    : undefined;

  let containerShape = 'rounded-xl';
  if (isCircular) {
    containerShape = 'rounded-full';
  } else if (frameStyle === 'apex_enforcer') {
    containerShape = 'rounded-2xl';
  } else if (isHex) {
    containerShape = 'rounded-none';
  }

  return (
    <div className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${currentSize.box} ${className}`}>
      {/* 1. UNDERLAY GLOW LAYER */}
      {frameStyle === 'shield_reticle' && (
        <div className={`absolute inset-0 ${containerShape} bg-cyan-500/20 blur-sm pointer-events-none`} />
      )}
      {frameStyle === 'phantom_matrix' && (
        <div className="absolute inset-0 bg-blue-600/25 blur-md pointer-events-none" style={hexClipStyle} />
      )}
      {frameStyle === 'recon_hud' && (
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-sm pointer-events-none" />
      )}
      {frameStyle === 'cipher_ring' && (
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-sm pointer-events-none" />
      )}
      {frameStyle === 'apex_enforcer' && (
        <div className={`absolute inset-0 ${containerShape} bg-gradient-to-tr from-cyan-500/25 via-indigo-600/25 to-yellow-500/15 blur-md pointer-events-none`} />
      )}

      {/* 2. AVATAR IMAGE (Exactly fits the frame geometry) */}
      <div
        className={`relative w-full h-full ${containerShape} overflow-hidden bg-[#020712] shadow-inner z-10`}
        style={hexClipStyle}
      >
        <img
          src={avatarSource}
          alt="Classified Agent"
          className="w-full h-full object-cover"
        />

        {/* Dynamic Scan Line Sweep for Phantom Operative */}
        {frameStyle === 'phantom_matrix' && (
          <div className="absolute inset-x-0 h-1 bg-cyan-300 opacity-60 shadow-[0_0_8px_#00e5ff] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* 3. PRECISION SVG SECRET AGENT FRAMES (viewBox 0 0 100 100 perfectly scaled) */}

      {/* FRAME 1: SOVEREIGN SHIELD RETICLE */}
      {frameStyle === 'shield_reticle' && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        >
          {/* Outer Border with exact corner radius */}
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="14"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_4px_#00e5ff]"
          />

          {/* Corner Reticle Brackets wrapping around the corner curves */}
          <path
            d="M 3 24 L 3 14 Q 3 3 14 3 L 24 3"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 76 3 L 86 3 Q 97 3 97 14 L 97 24"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 97 76 L 97 86 Q 97 97 86 97 L 76 97"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 24 97 L 14 97 Q 3 97 3 86 L 3 76"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Cardinal Radar Tick Marks */}
          <line x1="50" y1="0" x2="50" y2="7" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="93" x2="50" y2="100" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="50" x2="7" y2="50" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="93" y1="50" x2="100" y2="50" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />

          {/* Precision Target Lock Dots */}
          <circle cx="16" cy="16" r="1.8" fill="#00e5ff" />
          <circle cx="84" cy="16" r="1.8" fill="#00e5ff" />
          <circle cx="84" cy="84" r="1.8" fill="#00e5ff" />
          <circle cx="16" cy="84" r="1.8" fill="#00e5ff" />
        </svg>
      )}

      {/* FRAME 2: PHANTOM OPERATIVE HEX */}
      {frameStyle === 'phantom_matrix' && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        >
          {/* Primary Chamfered Hex Armor Path */}
          <path
            d="M 14 3 L 86 3 L 97 14 L 97 86 L 86 97 L 14 97 L 3 86 L 3 14 Z"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="filter drop-shadow-[0_0_5px_#3b82f6]"
          />

          {/* Inner Dashed Cyber Trace */}
          <path
            d="M 16 7 L 84 7 L 93 16 L 93 84 L 84 93 L 16 93 L 7 84 L 7 16 Z"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1.2"
            strokeDasharray="5 3"
            opacity="0.8"
          />

          {/* Chamfer Corner Nodes */}
          <circle cx="14" cy="3" r="1.8" fill="#00e5ff" />
          <circle cx="86" cy="3" r="1.8" fill="#00e5ff" />
          <circle cx="97" cy="14" r="1.8" fill="#00e5ff" />
          <circle cx="97" cy="86" r="1.8" fill="#00e5ff" />
          <circle cx="86" cy="97" r="1.8" fill="#00e5ff" />
          <circle cx="14" cy="97" r="1.8" fill="#00e5ff" />
          <circle cx="3" cy="86" r="1.8" fill="#00e5ff" />
          <circle cx="3" cy="14" r="1.8" fill="#00e5ff" />
        </svg>
      )}

      {/* FRAME 3: RECON STEALTH CROSSHAIR */}
      {frameStyle === 'recon_hud' && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        >
          {/* Main Scope Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="46.5"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_4px_#10b981]"
          />

          {/* Inner Azimuth Range Ring */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#34d399"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.75"
          />

          {/* Crosshair Spikes */}
          <line x1="50" y1="0" x2="50" y2="12" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="50" y1="88" x2="50" y2="100" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="50" x2="12" y2="50" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="88" y1="50" x2="100" y2="50" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />

          {/* 45-Degree Telemetry Ticks */}
          <line x1="22" y1="22" x2="26" y2="26" stroke="#10b981" strokeWidth="1.5" />
          <line x1="78" y1="22" x2="74" y2="26" stroke="#10b981" strokeWidth="1.5" />
          <line x1="78" y1="78" x2="74" y2="74" stroke="#10b981" strokeWidth="1.5" />
          <line x1="22" y1="78" x2="26" y2="74" stroke="#10b981" strokeWidth="1.5" />

          {/* Scope Center Crosshair Target Point */}
          <circle cx="50" cy="50" r="1.5" fill="#34d399" opacity="0.4" />
        </svg>
      )}

      {/* FRAME 4: BLACK OPS APERTURE */}
      {frameStyle === 'cipher_ring' && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        >
          {/* Inner Containment Ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
          />

          {/* Rotating Dashed Aperture Shutter */}
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2"
            strokeDasharray="9 5"
            className="animate-[spin_14s_linear_infinite] origin-center filter drop-shadow-[0_0_4px_#00e5ff]"
          />

          {/* 4 Biometric Iris Reticle Nodes */}
          <circle cx="50" cy="3" r="2.2" fill="#00e5ff" />
          <circle cx="50" cy="97" r="2.2" fill="#00e5ff" />
          <circle cx="3" cy="50" r="2.2" fill="#00e5ff" />
          <circle cx="97" cy="50" r="2.2" fill="#00e5ff" />
        </svg>
      )}

      {/* FRAME 5: QUANTUM APEX ENFORCER */}
      {frameStyle === 'apex_enforcer' && (
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
        >
          {/* Outer High-Voltage Chassis */}
          <rect
            x="3"
            y="3"
            width="94"
            height="94"
            rx="16"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_5px_#00e5ff]"
          />

          {/* Secondary Circuit Trace */}
          <rect
            x="6.5"
            y="6.5"
            width="87"
            height="87"
            rx="13"
            fill="none"
            stroke="#818cf8"
            strokeWidth="1.2"
            strokeDasharray="10 4"
            opacity="0.8"
          />

          {/* Gold Hazard Power Tabs */}
          <path
            d="M 3 26 L 3 16 Q 3 3 16 3 L 26 3"
            fill="none"
            stroke="#eab308"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 97 74 L 97 84 Q 97 97 84 97 L 74 97"
            fill="none"
            stroke="#eab308"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Quantum Status Diodes */}
          <circle cx="84" cy="16" r="3" fill="#eab308" className="filter drop-shadow-[0_0_3px_#eab308]" />
          <circle cx="16" cy="84" r="3" fill="#00e5ff" className="filter drop-shadow-[0_0_3px_#00e5ff]" />
        </svg>
      )}

      {/* 4. TACTICAL CLEARANCE BADGE CHIP */}
      {showBadge && (
        <span
          className={`absolute ${currentSize.badge} left-1/2 -translate-x-1/2 font-mono font-extrabold uppercase rounded bg-[#020714] border border-cyan-400 text-cyan-300 shadow-md shadow-black/80 z-30 whitespace-nowrap`}
        >
          {clearanceLevel}
        </span>
      )}
    </div>
  );
}
