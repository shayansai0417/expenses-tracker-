import { useEffect, useState, useRef } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  UploadCloud,
  FileSpreadsheet,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PenTool
} from 'lucide-react';
import type { NewTransactionInput } from '@/hooks/useTransactions';
import type { Transaction, TransactionType } from '@/types';
import { categoriesForType, getCategory } from '@/lib/categories';
import { todayISO } from '@/lib/format';
import { uuid } from '@/lib/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewTransactionInput) => void;
  onImportSuccess?: (imported: Transaction[]) => void;
}

interface Errors {
  title?: string;
  amount?: string;
  category?: string;
  date?: string;
}

type TabMode = 'manual' | 'csv';

export default function TransactionForm({ open, onClose, onSubmit, onImportSuccess }: Props) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabMode>('manual');

  // Manual Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  // CSV Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = categoriesForType(type);

  useEffect(() => {
    if (open) {
      setCategory('');
      resetCsvState();
    }
  }, [open, type]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function resetCsvState() {
    setSelectedFile(null);
    setIsDragging(false);
    setUploading(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // --- Manual Entry Validation & Submit ---
  function validateManual(): boolean {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Title is required';
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) e.amount = 'Enter a valid amount';
    if (!category) e.category = 'Select a category';
    if (!date) e.date = 'Select a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleManualSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateManual()) return;
    onSubmit({
      title,
      amount: parseFloat(amount),
      type,
      category,
      date,
      description: description.trim() || undefined,
    });
    setTitle('');
    setAmount('');
    setDescription('');
    setErrors({});
    onClose();
  }

  // --- CSV File Handling & Drag-and-Drop ---
  function handleFileValidation(file: File): boolean {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Invalid file format. Please select a valid .csv bank statement.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5MB limit.');
      return false;
    }

    return true;
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && handleFileValidation(file)) {
      setSelectedFile(file);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && handleFileValidation(file)) {
      setSelectedFile(file);
    }
  }

  function removeFile() {
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  // Helper to ensure authenticated JWT token for the backend API
  async function getAuthToken(): Promise<string> {
    const existing = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (existing) return existing;

    try {
      // Auto-authenticate with demo user for seamless local development
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Demo Account',
          email: 'demo@expensetracker.local',
          password: 'DemoPassword123!'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          return data.token;
        }
      } else if (res.status === 409) {
        // User already registered, log in instead
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'demo@expensetracker.local',
            password: 'DemoPassword123!'
          })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.token) {
            localStorage.setItem('token', loginData.token);
            return loginData.token;
          }
        }
      }
    } catch {
      // Fallback
    }

    return '';
  }

  // Normalize backend imported records into frontend Transaction format
  function normalizeRecord(item: any): Transaction {
    const cat = getCategory(item.category);

    let dateStr = item.date;
    if (typeof item.date === 'string' && item.date.includes('T')) {
      dateStr = item.date.split('T')[0];
    }

    return {
      id: item.id || item._id || uuid(),
      title: item.title || 'Statement Record',
      amount: Number(item.amount) || 0,
      type: item.type === 'income' ? 'income' : 'expense',
      category: cat.id,
      date: dateStr || todayISO(),
      description: item.description
    };
  }

  // --- Process CSV Submission ---
  async function handleProcessStatement() {
    if (!selectedFile) {
      setErrorMessage('Please select or drop a CSV statement file first.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getAuthToken();
      const formData = new FormData();
      formData.append('file', selectedFile);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/expenses/upload-csv', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to process statement CSV.');
      }

      const count = data.count || (data.imported ? data.imported.length : 0);
      setSuccessMessage(`Successfully imported ${count} transactions!`);

      // Sync imported records with parent transaction state if available
      if (onImportSuccess && Array.isArray(data.imported)) {
        const normalized = data.imported.map(normalizeRecord);
        onImportSuccess(normalized);
      }

      // Automatically reset file and close after brief success display
      setTimeout(() => {
        resetCsvState();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while uploading CSV statement.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative h-[100dvh] w-full max-w-md overflow-y-auto border-l border-[rgba(212,175,55,0.35)] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] text-[#F5E6B3] shadow-2xl shadow-black/50">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 border-b border-[rgba(212,175,55,0.25)] bg-[#11100d]/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5E6B3]">Add Transaction</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#BFA765] transition hover:bg-[#D4AF37]/15 hover:text-[#F5E6B3]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* 1. Tab Layout Switcher */}
          <div className="mt-4 flex rounded-xl border border-[rgba(212,175,55,0.2)] bg-[#0D0D0D] p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === 'manual'
                  ? 'bg-[#3B3018] text-[#F5E6B3] shadow-sm'
                  : 'text-[#BFA765] hover:text-[#F5E6B3]'
              }`}
            >
              <PenTool size={14} />
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('csv');
                setErrors({});
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${
                activeTab === 'csv'
                  ? 'bg-[#3B3018] text-[#F5E6B3] shadow-sm'
                  : 'text-[#BFA765] hover:text-[#F5E6B3]'
              }`}
            >
              <FileSpreadsheet size={14} />
              CSV Import
            </button>
          </div>
        </div>

        {/* Tab 1: Manual Entry Form */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#F5E6B3]">Type</label>
              <div className="grid grid-cols-2 gap-2">
                <TypeButton
                  active={type === 'expense'}
                  onClick={() => setType('expense')}
                  icon={<ArrowUpRight size={16} />}
                  label="Expense"
                  activeClass="bg-rose-700 text-white border-rose-700"
                />
                <TypeButton
                  active={type === 'income'}
                  onClick={() => setType('income')}
                  icon={<ArrowDownLeft size={16} />}
                  label="Income"
                  activeClass="bg-emerald-700 text-white border-emerald-700"
                />
              </div>
            </div>

            <Field label="Title" error={errors.title}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grocery shopping"
                className="input"
              />
            </Field>

            <Field label="Amount" error={errors.amount}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#BFA765]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="input pl-7"
                />
              </div>
            </Field>

            <Field label="Category" error={errors.category}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Date" error={errors.date}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Description (optional)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="input resize-none"
              />
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[rgba(212,175,55,0.35)] px-4 py-2.5 text-sm font-medium text-[#F5E6B3] transition hover:bg-[#D4AF37]/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#A67C00] px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110"
              >
                <Check size={16} />
                Add Transaction
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: CSV Import Interface */}
        {activeTab === 'csv' && (
          <div className="space-y-5 px-6 py-6">
            <div>
              <h3 className="text-sm font-semibold text-[#F5E6B3]">Upload Bank Statement</h3>
              <p className="mt-0.5 text-xs text-[#BFA765]">
                Automatically imports debits as expenses and credits as income.
              </p>
            </div>

            {/* Notification Messages */}
            {successMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-800 bg-emerald-950 px-4 py-3 text-xs font-medium text-emerald-200">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-300" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-800 bg-rose-950 px-4 py-3 text-xs font-medium text-rose-200">
                <AlertCircle size={16} className="shrink-0 text-rose-300" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Drag-and-drop dropzone container */}
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                  isDragging
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                    : 'border-[rgba(212,175,55,0.35)] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={onFileChange}
                  className="hidden"
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B3018] text-[#D4AF37] transition group-hover:bg-[#4A3B17] group-hover:text-[#F5E6B3]">
                  <UploadCloud size={24} />
                </div>
                <p className="mt-3 text-xs font-semibold text-[#F5E6B3]">
                  Drag & drop your bank statement here, or click to browse
                </p>
                <p className="mt-1 text-[11px] text-[#BFA765]">
                  Strictly accepts <span className="font-mono text-[#F5E6B3]">.csv</span> statements up to 5MB
                </p>
              </div>
            ) : (
              /* Selected file preview state */
              <div className="rounded-2xl border border-[rgba(212,175,55,0.25)] bg-[#11100d] p-4 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="truncate">
                      <p className="truncate text-xs font-semibold text-[#F5E6B3]">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-[#BFA765]">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-800 bg-rose-950 px-2.5 py-1.5 text-xs font-medium text-rose-300 shadow-sm transition hover:bg-rose-900"
                    title="Remove file"
                  >
                    <Trash2 size={13} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            )}

            {/* Instruction helper pills */}
            <div className="rounded-xl border border-[rgba(212,175,55,0.2)] bg-[#11100d] p-3.5">
              <p className="text-[11px] font-medium text-[#F5E6B3]">💡 Smart CSV Parser detects:</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] text-[#BFA765]">
                <li><strong className="text-[#F5E6B3]">Negative amounts</strong> are converted to positive expenses</li>
                <li><strong className="text-[#F5E6B3]">Positive amounts</strong> are automatically logged as income</li>
                <li>Categories are inferred from statement merchant descriptions</li>
              </ul>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-[rgba(212,175,55,0.35)] px-4 py-2.5 text-sm font-medium text-[#F5E6B3] transition hover:bg-[#D4AF37]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessStatement}
                disabled={!selectedFile || uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F2D675] via-[#D4AF37] to-[#A67C00] px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Process Statement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
        active
          ? activeClass
          : 'border-[rgba(212,175,55,0.35)] text-[#BFA765] hover:bg-[#D4AF37]/10 hover:text-[#F5E6B3]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#F5E6B3]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
