import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password.length < 8) {
      setError('INSUFFICIENT KEY STRENGTH: Passwords must exceed 8 characters. Do not make an adversary\'s job trivial.');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'AUTHENTICATION REJECTED: Invalid credentials or compromised session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono">
      <div className="bg-[#030919] border border-cyan-500/40 rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative shadow-cyan-950/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Hide Me Sovereign Shield"
            className="w-14 h-14 object-contain shield-glow mx-auto mb-2.5"
          />
          <h2 className="text-lg font-extrabold text-white uppercase tracking-wider">
            {isRegister ? 'ESTABLISH AGENT CREDENTIALS' : 'SOVEREIGN AGENT IDENTIFICATION'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? 'Initialize encrypted profile with 12-round bcrypt storage & isolated GridFS vault.'
              : 'Identify yourself to unseal your classified steganographic vault.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase">AGENT CALLSIGN (USERNAME)</label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. CipherOne"
                  className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1 uppercase">SECURE DISPATCH (EMAIL)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@secure.domain"
                className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-300 mb-1 flex items-center justify-between uppercase">
              <span>MASTER PASSWORD</span>
              {isRegister && <span className="text-[10px] text-cyan-400">Min 8 chars</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-cyan-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#020712] border border-cyan-500/30 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center space-x-2 mt-2"
          >
            <span>{loading ? 'VALIDATING ENTROPY SIGNATURE...' : isRegister ? 'INITIALIZE AGENT PROFILE' : 'AUTHENTICATE ACCESS'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-cyan-300 transition-colors uppercase tracking-wider"
          >
            {isRegister
              ? 'Already registered? Identify yourself'
              : "No credentials? Initialize profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
