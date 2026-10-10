import React, { useRef, useState } from 'react';
import {
  UploadCloud, FileAudio, Video, FileText,
  Presentation, Image as ImageIcon, FileCheck, Check
} from 'lucide-react';

export default function CarrierDropzone({ onFileSelected, selectedFile, isAnalyzing }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getCarrierIcon = (fileName = '') => {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    if (['.wav', '.mp3', '.ogg', '.aac', '.flac', '.m4a'].includes(ext)) {
      return { icon: FileAudio, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', label: 'Audio' };
    }
    if (['.mp4', '.mkv', '.avi', '.mov', '.webm'].includes(ext)) {
      return { icon: Video, color: 'text-purple-400 bg-purple-500/10 border-purple-500/30', label: 'Video' };
    }
    if (ext === '.pdf') {
      return { icon: FileText, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', label: 'PDF' };
    }
    if (['.docx', '.doc'].includes(ext)) {
      return { icon: FileText, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30', label: 'Word Document' };
    }
    if (['.pptx', '.ppt'].includes(ext)) {
      return { icon: Presentation, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', label: 'PowerPoint' };
    }
    if (['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Image' };
    }
    return { icon: FileCheck, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', label: 'File' };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const validateAndSelect = (file) => {
    const validExtensions = /\.(wav|mp3|ogg|aac|flac|m4a|mp4|mkv|avi|mov|webm|pdf|docx|doc|pptx|ppt|xlsx|png|jpg|jpeg|webp|bmp)$/i;
    if (!validExtensions.test(file.name)) {
      alert('VESSEL REJECTED: Only audio, video, PDF, Word, PowerPoint, or image files can be weaponized.');
      return;
    }
    onFileSelected(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileInfo = selectedFile ? getCarrierIcon(selectedFile.name) : null;
  const CarrierIcon = fileInfo ? fileInfo.icon : UploadCloud;

  return (
    <div className="space-y-3 font-mono">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 sm:p-9 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
            : selectedFile
            ? 'border-emerald-500/70 bg-[#020d22]'
            : 'border-cyan-500/25 hover:border-cyan-400/70 bg-[#020712] hover:bg-[#030a1c]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,.ogg,.aac,.flac,.m4a,.mp4,.mkv,.avi,.mov,.webm,.pdf,.docx,.doc,.pptx,.ppt,.xlsx,.png,.jpg,.jpeg,.webp,.bmp"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
              selectedFile
                ? fileInfo.color
                : 'bg-[#030e26] border-cyan-500/30 text-cyan-400'
            }`}
          >
            <CarrierIcon className="w-7 h-7" />
          </div>

          <div>
            {selectedFile ? (
              <div className="space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <span className="font-bold text-white text-sm">{selectedFile.name}</span>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center justify-center space-x-2 text-xs font-mono text-cyan-300">
                  <span className={`px-2 py-0.5 rounded-full border ${fileInfo.color} uppercase text-[10px]`}>
                    {fileInfo.label}
                  </span>
                  <span>&bull;</span>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  SUBMIT CARRIER HOST VESSEL OR{' '}
                  <span className="text-cyan-400 underline font-extrabold">BROWSE DRIVE</span>
                </p>
                <p className="text-xs text-slate-400">
                  Accepted carriers: Audio (.wav/.mp3), Video (.mp4/.mkv), PDF, DOCX, PPTX, Images
                </p>
              </div>
            )}
          </div>

          {isAnalyzing && (
            <p className="text-xs text-cyan-300 font-mono tracking-wider uppercase animate-pulse">
              CALCULATING CARRIER ENTROPY &amp; CAPACITY BUDGET...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
