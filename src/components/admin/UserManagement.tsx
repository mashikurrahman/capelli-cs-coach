'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users, Plus, Search, UserCheck, UserX, Shield, Edit2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatRelativeTime } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/cn';

const ROLES = ['ADMIN', 'TEAM_LEADER', 'TRAINER', 'QA', 'AGENT'] as const;
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  TEAM_LEADER: 'bg-purple-100 text-purple-700',
  TRAINER: 'bg-blue-100 text-blue-700',
  QA: 'bg-yellow-100 text-yellow-700',
  AGENT: 'bg-gray-100 text-gray-700',
};

const createSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'TEAM_LEADER', 'TRAINER', 'AGENT', 'QA']),
});

type CreateForm = z.infer<typeof createSchema>;

async function fetchUsers(q: string) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  const res = await fetch(`/api/users?${params}`);
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

export default function UserManagement() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [dQ, setDQ] = useState('');
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['users', dQ], queryFn: () => fetchUsers(dQ) });
  const users: any[] = data?.users ?? [];

  function handleSearch(val: string) {
    setQ(val);
    clearTimeout((window as any).__uSearch);
    (window as any).__uSearch = setTimeout(() => setDQ(val), 350);
  }

  const createUser = useMutation({
    mutationFn: async (data: CreateForm) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setCreating(false);
      toast({ title: 'User created successfully', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'AGENT' },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team access and roles</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 bg-capelli-navy hover:bg-blue-900">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={q}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">{users.length} users</p>
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-capelli-navy flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {u.name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', u.isActive ? 'text-gray-800' : 'text-gray-400 line-through')}>
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ROLE_COLORS[u.role])}>
                  {u.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">{u._count?.sessions ?? 0} tickets</span>
                {u.lastLoginAt && (
                  <span className="text-xs text-gray-400 hidden md:block">
                    {formatRelativeTime(new Date(u.lastLoginAt))}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                  className={cn(u.isActive ? 'text-green-600 hover:text-red-600' : 'text-gray-400 hover:text-green-600')}
                  title={u.isActive ? 'Deactivate' : 'Activate'}
                >
                  {u.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create user dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(d => createUser.mutate(d))} className="space-y-4 mt-2">
            <div>
              <Label>Full Name</Label>
              <Input {...register('name')} placeholder="Jane Smith" className="mt-1" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Email Address</Label>
              <Input {...register('email')} type="email" placeholder="jane@capellisports.com" className="mt-1" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Label>Temporary Password</Label>
              <Input {...register('password')} type="password" placeholder="Min. 8 characters" className="mt-1" />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <Label>Role</Label>
              <select {...register('role')} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-capelli-navy">
                {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setCreating(false); reset(); }} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={createUser.isPending} className="flex-1 bg-capelli-navy hover:bg-blue-900">
                {createUser.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
