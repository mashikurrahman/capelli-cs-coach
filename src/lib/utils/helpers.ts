import { ISSUE_LABELS } from '@/types';

export function formatIssueCategory(category: string): string {
  return ISSUE_LABELS[category] ?? category;
}

export function getRiskColor(risk: string) {
  switch (risk?.toLowerCase()) {
    case 'high': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-800' };
    case 'medium': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' };
    case 'low': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100 text-green-800' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-800' };
  }
}

export function getConfidenceColor(score: number) {
  if (score >= 80) return { color: 'text-green-600', bar: 'bg-green-500', label: 'High' };
  if (score >= 55) return { color: 'text-yellow-600', bar: 'bg-yellow-500', label: 'Medium' };
  return { color: 'text-red-600', bar: 'bg-red-500', label: 'Low' };
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'Open': return 'bg-blue-100 text-blue-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'Solved': return 'bg-green-100 text-green-800';
    case 'On-hold': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function redactPII(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b(?:order|#)\s*([A-Z]{0,3}\d{4,10})\b/gi, '[ORDER#]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const STEP_NAMES = [
  'Read & Identify',
  'Collect Information',
  'System Checks',
  'Apply Policy',
  'Customer Email',
  'Internal Note',
  'Zendesk Setup',
  'Pre-Send Check',
  'Complete',
] as const;

export type StepName = typeof STEP_NAMES[number];
