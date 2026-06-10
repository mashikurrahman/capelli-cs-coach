import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import type { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  return session.user as { id: string; email: string; name: string; role: UserRole };
}

export async function requireRole(requiredRole: UserRole) {
  const user = await requireAuth();
  if (!hasRole(user.role, requiredRole)) redirect('/dashboard');
  return user;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 5,
  TEAM_LEADER: 4,
  TRAINER: 3,
  QA: 2,
  AGENT: 1,
};

export function hasRole(userRole: UserRole, required: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export function canUpload(role: UserRole) {
  return role === 'ADMIN' || role === 'TRAINER';
}

export function canManageWorkflows(role: UserRole) {
  return role === 'ADMIN' || role === 'TEAM_LEADER';
}

export function canViewSensitive(role: UserRole) {
  return role === 'ADMIN' || role === 'TEAM_LEADER';
}

export function canViewAnalytics(role: UserRole) {
  return role === 'ADMIN' || role === 'TEAM_LEADER' || role === 'QA';
}

export function canManageUsers(role: UserRole) {
  return role === 'ADMIN';
}
