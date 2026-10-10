import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import WaveformPlayer from '../components/WaveformPlayer';
import AgentAvatar from '../components/AgentAvatar';
import {
  FolderKey, Search, Play, Unlock, Edit3, Trash2, Download,
  Lock, X, Check, AlertTriangle, KeyRound, Plus, LogIn
} from 'lucide-react';

export default function VaultPage({ onNavigateToEncoder, onOpenAuth, onOpenProfile }) {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCarrierType, setSelectedCarrierType] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  const [activePlayerRecord, setActivePlayerRecord] = useState(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract Modal State
  const [decodingRecord, setDecodingRecord] = useState(null);
  const [decodePassphrase, setDecodePassphrase] = useState('');
  const [decodeResult, setDecodeResult] = useState(null);
  const [decodeError, setDecodeError] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);

  const fetchVault = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedTag) params.tag = selectedTag;
      if (selectedCarrierType) params.carrierType = selectedCarrierType;

      const res = await axios.get('/api/carrier/my-vault', { params });
      if (res.data.success) {
        setRecords(res.data.data);
        const tagsSet = new Set();
        res.data.data.forEach((r) => r.tags?.forEach((t) => tagsSet.add(t)));
        setAllTags(Array.from(tagsSet));
      }
    } catch (err) {
      console.error('Failed to load vault files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, [isAuthenticated, selectedTag, selectedCarrierType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVault();
  };

  const handleOpenEdit = (record) => {
    setEditingRecord(record);
    setEditTitle(record.title);
    setEditDescription(record.description || '');
    setEditTags(record.tags ? record.tags.join(', ') : '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      const res = await axios.put(`/api/carrier/${editingRecord._id}`, {
        title: editTitle,
        description: editDescription,
        tags: editTags
      });
      if (res.data.success) {
        setRecords((prev) =>
          prev.map((r) => (r._id === editingRecord._id ? res.data.data : r))
        );
        setEditingRecord(null);
      }
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`/api/carrier/${deletingRecord._id}`);
      if (res.data.success) {
        setRecords((prev) => prev.filter((r) => r._id !== deletingRecord._id));
        if (activePlayerRecord?._id === deletingRecord._id) {
          setActivePlayerRecord(null);
        }
        setDeletingRecord(null);
      }
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDecode = (record) => {
    setDecodingRecord(record);
    setDecodePassphrase('');
    setDecodeResult(null);
    setDecodeError('');
  };

  const handlePerformDecode = async (e) => {
    e.preventDefault();
    if (!decodingRecord) return;
    setIsDecoding(true);
    setDecodeError('');
    try {
      const res = await axios.post('/api/carrier/decode', {
        fileId: decodingRecord.gridFsFileId,
        passphrase: decodePassphrase
      });
      if (res.data.success) {
        setDecodeResult(res.data.data);
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setDecodeError(err.response?.data?.message || err.message || 'Incorrect password or corrupted file.');
    } finally {
      setIsDecoding(false);
    }
  };

  const getCarrierBadge = (type) => {
    switch (type) {
      case 'audio': return { label: 'Audio', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80' };
      case 'video': return { label: 'Video', color: 'bg-purple-950/80 text-purple-300 border-purple-800/80' };
      case 'pdf': return { label: 'PDF', color: 'bg-rose-950/80 text-rose-300 border-rose-800/80' };
      case 'docx': return { label: 'Word', color: 'bg-blue-950/80 text-blue-300 border-blue-800/80' };
      case 'pptx': return { label: 'PowerPoint', color: 'bg-amber-950/80 text-amber-300 border-amber-800/80' };
      case 'image': return { label: 'Image', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80' };
      default: return { label: 'File', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4 space-y-5 font-mono">
        <div className="w-16 h-16 rounded-2xl bg-[#030e26] border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-950/60">
          <FolderKey className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">
          CLASSIFIED VAULT ACCESS RESTRICTED
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed">
          You are unauthenticated. Only verified operators with active session tokens can inspect weaponized vessels in GridFS storage.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs uppercase tracking-wider inline-flex items-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all"
        >
          <LogIn className="w-4 h-4" />
          <span>ESTABLISH IDENTITY</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-mono">
      {/* Active Operator Dossier Banner */}
      <div className="hideme-card p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-500/30">
        <div className="flex items-center space-x-4">
          <AgentAvatar
            avatar={user?.avatar}
            frameStyle={user?.frameStyle || 'shield_reticle'}
            size="md"
            showBadge={true}
            clearanceLevel={user?.badge || 'LVL 1'}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-white uppercase">
                {user?.callsign || user?.username}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold uppercase">
                {user?.clearanceLevel || 'LEVEL 1 - ROOKIE INFILTRATOR'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#030e26] border border-cyan-400/40 text-cyan-400 font-bold uppercase">
                {user?.operationsCount || 0} OPS COMPLETED
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold">
                {user?.xp || 0} XP
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              {user?.bio || 'Operator verified. Full steganographic read/write and GridFS cluster clearance granted.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="px-4 py-2 rounded-xl bg-[#030e26] hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase flex items-center space-x-1.5 transition-all self-stretch sm:self-auto justify-center shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>EDIT DOSSIER</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase">
              CLASSIFIED VAULT ARSENAL
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#030e26] text-cyan-300 border border-cyan-500/40 font-bold">
              {records.length} SECURED VESSELS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Encrypted GridFS cluster with 255 KB binary chunk isolation &bull; 100% bit-parity sealed
          </p>
        </div>

        <button
          onClick={onNavigateToEncoder}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-black font-extrabold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>BURY NEW PAYLOAD</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="hideme-card p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or tag..."
              className="w-full bg-[#05070e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </form>

          {/* Type filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
            {['', 'audio', 'video', 'pdf', 'docx', 'pptx', 'image'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedCarrierType(type)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedCarrierType === type
                    ? 'bg-cyan-500 text-black font-semibold'
                    : 'bg-[#05070e] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {type ? type.toUpperCase() : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 border-t border-white/[0.08] text-xs">
            <span className="text-slate-500">Tags:</span>
            <button
              onClick={() => setSelectedTag('')}
              className={`px-2 py-0.5 rounded ${
                selectedTag === '' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                className={`px-2 py-0.5 rounded ${
                  selectedTag === tag ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Active Player */}
      {activePlayerRecord && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">
              Playing: {activePlayerRecord.title}
            </span>
            <button
              onClick={() => setActivePlayerRecord(null)}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Player</span>
            </button>
          </div>

          {activePlayerRecord.carrierType === 'video' ? (
            <div className="bg-[#0b1020] p-4 rounded-2xl border border-white/10 space-y-2">
              <video
                src={`/api/carrier/stream/${activePlayerRecord.gridFsFileId}`}
                controls
                autoPlay
                className="w-full max-h-80 rounded-xl bg-black object-contain"
              />
            </div>
          ) : (
            <WaveformPlayer
              audioUrl={`/api/carrier/stream/${activePlayerRecord.gridFsFileId}`}
              title={activePlayerRecord.title}
            />
          )}
        </div>
      )}

      {/* Records Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">
          Loading files...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 hideme-card rounded-2xl p-6 space-y-3">
          <FolderKey className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-slate-300 font-medium text-sm">No files in your vault</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || selectedTag || selectedCarrierType
              ? 'No files match your search criteria.'
              : 'You have not encoded any files yet.'}
          </p>
          <button
            onClick={onNavigateToEncoder}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Hide Your First Message</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => {
            const badge = getCarrierBadge(record.carrierType);
            return (
              <div
                key={record._id}
                className="hideme-card rounded-2xl p-4 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm line-clamp-1">
                      {record.title}
                    </h3>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {record.isPasswordProtected && (
                        <span title="Password Protected" className="p-1 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {record.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {record.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-[#05070e] p-2.5 rounded-xl border border-white/5 font-mono">
                    <div>
                      <span className="text-slate-500 block">File:</span>
                      <span className="text-slate-300 truncate block">{record.originalName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Size:</span>
                      <span className="text-slate-300">{(record.fileSizeBytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  {record.tags && record.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-cyan-300 border border-white/10"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 mt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {(record.carrierType === 'audio' || record.carrierType === 'video') && (
                      <button
                        onClick={() => setActivePlayerRecord(record)}
                        title="Play"
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenDecode(record)}
                      title="Extract Hidden Text"
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                    </button>

                    <a
                      href={`/api/carrier/download/${record.gridFsFileId}`}
                      download
                      title="Download File"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(record)}
                      title="Edit Details"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingRecord(record)}
                      title="Delete"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1020] border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setEditingRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white mb-4">Edit File Details</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#05070e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-[#05070e] border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-[#05070e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-black"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1020] border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Delete File?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete <strong className="text-white">"{deletingRecord.title}"</strong>? This will permanently remove the file from your vault.
            </p>
            <div className="flex items-center justify-center space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXTRACT MODAL */}
      {decodingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1020] border border-white/10 rounded-2xl w-full max-w-md p-6 relative space-y-4">
            <button
              onClick={() => setDecodingRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-white">Extract: {decodingRecord.title}</h3>

            <form onSubmit={handlePerformDecode} className="space-y-3.5">
              {decodingRecord.isPasswordProtected && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1 flex items-center space-x-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    <span>Enter Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={decodePassphrase}
                    onChange={(e) => setDecodePassphrase(e.target.value)}
                    placeholder="Password..."
                    className="w-full bg-[#05070e] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              )}

              {decodeError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
                  {decodeError}
                </div>
              )}

              <button
                type="submit"
                disabled={isDecoding}
                className="w-full py-2.5 rounded-xl font-semibold text-xs bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>{isDecoding ? 'Extracting...' : 'Extract Hidden Message'}</span>
              </button>
            </form>

            {decodeResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#05070e] border border-emerald-500/40 space-y-1.5">
                <span className="text-[11px] font-medium text-emerald-400 block">
                  Hidden Message:
                </span>
                <p className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-words">
                  {decodeResult.secretText}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
