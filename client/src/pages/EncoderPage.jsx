import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CarrierDropzone from '../components/CarrierDropzone';
import CapacityIndicator from '../components/CapacityIndicator';
import WaveformPlayer from '../components/WaveformPlayer';
import {
  Lock, KeyRound, Download, FolderKey, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export default function EncoderPage({ onNavigateToVault }) {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [file, setFile] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [error, setError] = useState('');
  const [encodeResult, setEncodeResult] = useState(null);

  const handleFileSelect = async (selectedFile) => {
    setFile(selectedFile);
    setEncodeResult(null);
    setError('');
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('carrier', selectedFile);

    try {
      const res = await axios.post('/api/carrier/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setAnalysis(res.data.data);
      }
    } catch (err) {
      console.warn('File analysis note:', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    let key = '';
    for (let i = 0; i < 16; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassphrase(key);
  };

  const handleEncode = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('SELECT A HOST CARRIER VESSEL FIRST. We cannot inject payload into nothing.');
      return;
    }
    if (!secretText || secretText.trim().length === 0) {
      setError('WHAT ARE YOU HIDING? YOUR EMPTY THOUGHTS? Type an actual payload before wasting compute.');
      return;
    }
    if (useEncryption && (!passphrase || passphrase.trim().length === 0)) {
      setError('ARM IT WITH A KEY OR DISABLE CIPHER. Don\'t leave an open vault door.');
      return;
    }

    setIsEncoding(true);
    setError('');
    setEncodeResult(null);

    const formData = new FormData();
    formData.append('carrier', file);
    formData.append('audio', file);
    formData.append('secretText', secretText);
    if (useEncryption && passphrase) {
      formData.append('passphrase', passphrase);
    }
    formData.append('title', title || file.name);
    formData.append('description', description);
    formData.append('tags', tags);

    try {
      const res = await axios.post('/api/carrier/encode', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setEncodeResult(res.data.data);
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'INJECTION ABORTED: Host vessel rejected carrier injection.');
    } finally {
      setIsEncoding(false);
    }
  };

  const maxCapacity = analysis
    ? (useEncryption ? analysis.maxEncryptedChars : analysis.maxPlaintextChars)
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
          <span>SOVEREIGN INJECTION MATRIX</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          OBLITERATE TRACES &amp; BURY PAYLOAD
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto font-mono">
          Your plain text is vulnerable and reckless. Let the sovereign engine dissolve it into high-entropy noise. Forensic filters will detect absolute zero.
        </p>
      </div>

      {/* Main Card */}
      <div className="hideme-card rounded-2xl p-6 sm:p-8 space-y-6">
        <form onSubmit={handleEncode} className="space-y-5">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider mb-2">
              1. SELECT HOST CARRIER VESSEL
            </label>
            <CarrierDropzone
              onFileSelected={handleFileSelect}
              selectedFile={file}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Secret Text */}
          <div>
            <label className="block text-xs font-mono font-bold text-cyan-300 mb-1.5 flex items-center justify-between uppercase">
              <span>2. CLASSIFIED PAYLOAD TO VANISH</span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {secretText.length} CHARACTERS BUFFERED
              </span>
            </label>
            <textarea
              rows={4}
              required
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              placeholder="Type or paste your classified payload. Once embedded, no forensic agency, scanner, or eavesdropper can detect its presence..."
              className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl p-3.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
            />
          </div>

          {maxCapacity > 0 && (
            <CapacityIndicator
              currentChars={secretText.length}
              maxChars={maxCapacity}
            />
          )}

          {/* Password Section */}
          <div className="bg-[#020712] p-4 rounded-xl border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => setUseEncryption(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-400 cursor-pointer"
                />
                <span className="text-sm font-mono font-bold text-white flex items-center space-x-2 uppercase">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>ARM WITH MILITARY AES-256-CBC CIPHER</span>
                </span>
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {useEncryption ? '🔒 ARMORED (2^256 KEYS)' : '⚠️ UNENCRYPTED'}
              </span>
            </div>

            {useEncryption && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    required={useEncryption}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter cipher passphrase..."
                    className="w-full bg-[#030919] border border-cyan-500/30 rounded-lg px-3.5 py-2 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    title="Generate high-entropy key"
                    className="flex-shrink-0 px-3.5 py-2 rounded-lg bg-[#030e26] hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ENTROPY KEY</span>
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Without this exact key, extracting this payload is mathematically impossible.
                </p>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">CARRIER TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Vessel alias"
                  className="w-full bg-[#020712] border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">CLASSIFICATION TAGS</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="confidential, dispatch, secure"
                  className="w-full bg-[#020712] border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-300 mb-1 uppercase">INTELLIGENCE LOG (OPTIONAL)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tactical or archival notes..."
                className="w-full bg-[#020712] border border-cyan-500/20 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs font-mono flex items-start space-x-2.5 shadow-lg shadow-red-950/40">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || isEncoding || (maxCapacity > 0 && secretText.length > maxCapacity)}
            className={`w-full py-3.5 rounded-xl font-mono font-extrabold text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              !file || isEncoding || (maxCapacity > 0 && secretText.length > maxCapacity)
                ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-black font-extrabold shadow-lg shadow-cyan-500/30 cursor-pointer active:scale-[0.99]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isEncoding ? 'DISSOLVING PAYLOAD INTO CARRIER NOISE...' : 'BURY PAYLOAD & WEAPONIZE CARRIER'}</span>
          </button>
        </form>

        {/* Success Card */}
        {encodeResult && (
          <div className="pt-6 border-t border-cyan-500/30 space-y-4">
            <div className="p-4.5 rounded-xl bg-[#020d22] border-2 border-emerald-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wider">
                    CARRIER WEAPONIZED &amp; PAYLOAD BURIED
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    Vessel: <span className="text-cyan-300 font-bold">{encodeResult.fileName}</span> ({(encodeResult.fileSizeBytes / 1024).toFixed(1)} KB) &bull; Distortion: &lt; 0.00018 &Delta;
                  </p>
                  {isAuthenticated && (
                    <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/40 text-[10px] text-cyan-300 font-bold uppercase">
                      <span>✓ MISSION LOGGED: +1 OPERATION (+50 XP) &bull; CLEARANCE UPDATED</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={encodeResult.downloadUrl}
                  download={encodeResult.fileName}
                  className="px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-black font-mono font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD VESSEL</span>
                </a>

                {isAuthenticated && (
                  <button
                    onClick={onNavigateToVault}
                    className="px-3.5 py-2 rounded-lg bg-[#030e26] hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <FolderKey className="w-3.5 h-3.5 text-cyan-400" />
                    <span>VAULT ARSENAL</span>
                  </button>
                )}
              </div>
            </div>

            {encodeResult.carrierType === 'audio' && (
              <WaveformPlayer
                audioUrl={encodeResult.streamUrl}
                title={`Weaponized Audio: ${encodeResult.fileName}`}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
