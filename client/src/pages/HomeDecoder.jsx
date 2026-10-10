import React, { useState } from 'react';
import axios from 'axios';
import CarrierDropzone from '../components/CarrierDropzone';
import WaveformPlayer from '../components/WaveformPlayer';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound, Unlock, Copy, Check, Video,
  Image as ImageIcon, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function HomeDecoder() {
  const { isAuthenticated, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const getCarrierType = (fileName = '') => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (['.wav', '.mp3', '.ogg', '.aac', '.flac', '.m4a'].includes(ext)) return 'audio';
    if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) return 'video';
    if (ext === '.pdf') return 'pdf';
    if (['.docx', '.doc'].includes(ext)) return 'docx';
    if (['.pptx', '.ppt'].includes(ext)) return 'pptx';
    if (['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext)) return 'image';
    return 'generic';
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setError('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleDecode = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('FEED ME A CARRIER FILE FIRST. We do not rip secrets out of thin air.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('carrier', file);
    formData.append('audio', file);
    if (passphrase) {
      formData.append('passphrase', passphrase);
    }

    try {
      const res = await axios.post('/api/carrier/decode', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setResult(res.data.data);
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      const rawMsg = err.response?.data?.message || err.message || '';
      if (passphrase) {
        setError(`DECRYPTION BREACH FAILED: Passphrase rejected or cipher block corrupted. Did you forget your key, or did you upload a normal file by mistake? [${rawMsg}]`);
      } else {
        setError(`ZERO PAYLOAD DETECTED: Carrier matrix has pure organic noise. Either no payload is buried here, or it was armed with a password you failed to supply. [${rawMsg}]`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.secretText) {
      navigator.clipboard.writeText(result.secretText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const carrierType = file ? getCarrierType(file.name) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
          <span>FORENSIC EXTRACTION ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          PENETRATE &amp; RIP OUT HIDDEN PAYLOAD
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto font-mono">
          Think you can pierce sovereign steganography? Submit the host vessel. If a payload exists and your key matches, we will tear it out. If not, don't waste our cycles.
        </p>
      </div>

      {/* Main Card */}
      <div className="hideme-card rounded-2xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleDecode} className="space-y-5">
          {/* File Upload */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-2">
              1. SUBMIT HOST CARRIER VESSEL
            </label>
            <CarrierDropzone
              onFileSelected={handleFileSelect}
              selectedFile={file}
            />
          </div>

          {/* Previews */}
          {file && previewUrl && (
            <div>
              {carrierType === 'audio' && (
                <WaveformPlayer
                  audioUrl={previewUrl}
                  title={`Audio File: ${file.name}`}
                />
              )}

              {carrierType === 'video' && (
                <div className="bg-[#020712] p-3 rounded-xl border border-cyan-500/20 space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1.5 uppercase">
                    <Video className="w-3.5 h-3.5" />
                    <span>Host Video Carrier Feed</span>
                  </span>
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-56 rounded-lg bg-black object-contain border border-cyan-500/20"
                  />
                </div>
              )}

              {carrierType === 'image' && (
                <div className="bg-[#020712] p-3 rounded-xl border border-cyan-500/20 space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center space-x-1.5 uppercase">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Host Image Carrier Inspection</span>
                  </span>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-56 rounded-lg object-contain bg-black/40 mx-auto border border-cyan-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* Password Input */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-300 mb-1.5 flex items-center justify-between uppercase">
              <span className="flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>2. CIPHER PASSPHRASE (IF ARMORED)</span>
              </span>
              <span className="text-[11px] text-slate-400">Leave blank if sender was careless</span>
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter cryptographic passphrase..."
              className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs font-mono flex items-start space-x-2.5 shadow-lg shadow-red-950/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className={`w-full py-3.5 rounded-xl font-mono font-extrabold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              !file || loading
                ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-500/30 cursor-pointer active:scale-[0.99]'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>{loading ? 'DISSECTING CARRIER ENTROPY MATRIX...' : 'RIP OUT HIDDEN PAYLOAD'}</span>
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="pt-6 border-t border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-mono font-bold text-sm text-emerald-300 tracking-wide uppercase">
                  PAYLOAD UNMASKED &amp; RETRIEVED:
                </h3>
              </div>
              <div className="text-xs font-mono px-2.5 py-1 rounded bg-[#030e26] border border-cyan-500/40 text-cyan-300 font-bold">
                {result.isEncrypted ? '🔒 AES-256 DEFENSES CRACKED' : 'UNARMED PLAINTEXT'}
              </div>
            </div>

            <div className="relative">
              <div className="w-full bg-[#020712] border-2 border-emerald-500/50 rounded-xl p-4.5 text-emerald-300 font-mono text-sm whitespace-pre-wrap break-words min-h-[100px] shadow-lg shadow-emerald-950/50 selection:bg-emerald-400 selection:text-black">
                {result.secretText}
              </div>

              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 px-3.5 py-1.5 rounded-lg bg-[#030e26] hover:bg-cyan-950/80 text-cyan-200 border border-cyan-500/40 text-xs font-mono flex items-center space-x-1.5 transition-colors shadow-md"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">COPIED. WIPE TRACES.</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>COPY PAYLOAD</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              {isAuthenticated ? (
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40 text-[10px] text-cyan-300 font-mono font-bold uppercase">
                  <span>✓ MISSION LOGGED: +1 OPERATION (+30 XP) &bull; CLEARANCE UPDATED</span>
                </div>
              ) : <div />}
              <p className="text-[11px] font-mono text-slate-400">
                PAYLOAD SIZE: {result.secretText?.length || 0} BYTES &bull; INTEGRITY VERIFIED
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
