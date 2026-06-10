'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, FileSpreadsheet, CheckCircle2, XCircle,
  Loader2, Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { formatFileSize, formatRelativeTime } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/cn';

const DOC_CATEGORIES = [
  { value: 'TRAINING_MANUAL', label: 'Training Manual' },
  { value: 'SOP', label: 'SOP / Procedure' },
  { value: 'EMAIL_TEMPLATE', label: 'Email Templates' },
  { value: 'ZENDESK_TAGS', label: 'Zendesk Tags Sheet' },
  { value: 'CONTACTS', label: 'Contact Sheet' },
  { value: 'CLUBS_PASSWORDS', label: 'Clubs / Passwords' },
  { value: 'PRODUCT_GUIDE', label: 'Product Guide' },
  { value: 'POLICY', label: 'Policy Document' },
  { value: 'PRACTICE_QUESTIONS', label: 'Practice Questions' },
  { value: 'CHEAT_SHEET', label: 'Cheat Sheet' },
  { value: 'GENERAL', label: 'General' },
];

interface UploadJob {
  file: File;
  id: string;
  category: string;
  isSensitive: boolean;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
  docId?: string;
}

export default function DocumentUpload({ initialDocuments }: { initialDocuments: any[] }) {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [docs, setDocs] = useState<any[]>(initialDocuments);
  const [deleting, setDeleting] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newJobs: UploadJob[] = acceptedFiles.map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      category: 'GENERAL',
      isSensitive: false,
      status: 'pending',
    }));
    setJobs(prev => [...prev, ...newJobs]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxSize: 52428800,
  });

  function updateJob(id: string, patch: Partial<UploadJob>) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
  }

  async function processJob(job: UploadJob) {
    updateJob(job.id, { status: 'uploading' });
    try {
      const fd = new FormData();
      fd.append('file', job.file);
      fd.append('category', job.category);
      fd.append('isSensitive', String(job.isSensitive));

      const uploadRes = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error ?? 'Upload failed');
      const { documentId } = await uploadRes.json();

      updateJob(job.id, { status: 'processing', docId: documentId });

      const processRes = await fetch('/api/documents/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      if (!processRes.ok) throw new Error((await processRes.json()).error ?? 'Processing failed');

      updateJob(job.id, { status: 'done', docId: documentId });

      // Refresh doc list
      const listRes = await fetch('/api/documents');
      const listData = await listRes.json();
      setDocs(listData.documents ?? []);

      toast({ title: `${job.file.name} processed successfully`, variant: 'success' });
    } catch (err: any) {
      updateJob(job.id, { status: 'error', error: err.message });
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  }

  async function handleUploadAll() {
    const pending = jobs.filter(j => j.status === 'pending');
    for (const job of pending) {
      await processJob(job);
    }
  }

  async function deleteDoc(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      setDocs(prev => prev.filter(d => d.id !== id));
      toast({ title: 'Document deleted', variant: 'success' });
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Training Documents</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          PDF, DOCX, XLSX, CSV, TXT supported · Max 50MB per file
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
          isDragActive ? 'border-capelli-navy bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-600">
          {isDragActive ? 'Drop files here…' : 'Drag & drop training files here'}
        </p>
        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
      </div>

      {/* Upload queue */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Upload Queue ({jobs.length})</h2>
            {jobs.some(j => j.status === 'pending') && (
              <Button onClick={handleUploadAll} size="sm" className="gap-2 bg-capelli-navy hover:bg-blue-900">
                <Upload className="w-3.5 h-3.5" />
                Upload All
              </Button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {jobs.map(job => (
              <UploadJobRow
                key={job.id}
                job={job}
                onCategoryChange={cat => updateJob(job.id, { category: cat })}
                onSensitiveToggle={v => updateJob(job.id, { isSensitive: v })}
                onUpload={() => processJob(job)}
                onRemove={() => setJobs(prev => prev.filter(j => j.id !== job.id))}
              />
            ))}
          </div>
        </div>
      )}

      {/* Existing documents */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Processed Documents ({docs.length})</h2>
        </div>
        {docs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {docs.map(doc => (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatFileSize(doc.fileSize)} · {doc._count?.chunks ?? 0} chunks · {doc.uploadedBy?.name}
                    {' · '}{formatRelativeTime(new Date(doc.createdAt))}
                  </p>
                </div>
                <Badge variant={doc.status === 'PROCESSED' ? 'success' : doc.status === 'FAILED' ? 'danger' : 'warning'}>
                  {doc.status}
                </Badge>
                {doc.isSensitive && <Badge variant="danger" className="text-xs">SENSITIVE</Badge>}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteDoc(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-gray-400 hover:text-red-600"
                >
                  {deleting === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadJobRow({
  job, onCategoryChange, onSensitiveToggle, onUpload, onRemove
}: {
  job: UploadJob;
  onCategoryChange: (c: string) => void;
  onSensitiveToggle: (v: boolean) => void;
  onUpload: () => void;
  onRemove: () => void;
}) {
  const isRunning = job.status === 'uploading' || job.status === 'processing';
  const isDone = job.status === 'done';
  const isError = job.status === 'error';

  return (
    <div className="px-5 py-3.5 flex items-center gap-3">
      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">{job.file.name}</p>
        <p className="text-xs text-gray-400">{formatFileSize(job.file.size)}</p>
        {isError && <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{job.error}</p>}
      </div>

      {job.status === 'pending' && (
        <select
          value={job.category}
          onChange={e => onCategoryChange(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-capelli-navy"
        >
          {DOC_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      )}

      {isRunning && (
        <div className="flex items-center gap-1.5 text-xs text-capelli-navy">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {job.status === 'uploading' ? 'Uploading…' : 'Processing & embedding…'}
        </div>
      )}

      {isDone && <CheckCircle2 className="w-5 h-5 text-capelli-success" />}

      {job.status === 'pending' && (
        <Button size="sm" variant="outline" onClick={onUpload} className="gap-1.5 flex-shrink-0">
          <Upload className="w-3.5 h-3.5" /> Upload
        </Button>
      )}

      {!isRunning && (
        <Button size="icon-sm" variant="ghost" onClick={onRemove} className="text-gray-400 hover:text-red-600 flex-shrink-0">
          <XCircle className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
