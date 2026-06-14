'use client';

import { useEffect } from 'react';
import { recordRecentTemplate } from '@/lib/recents';

// Invisible recorder: any time a template detail page mounts, remember it so the
// command palette can offer it under "Recent". Captures every entry path.
export default function RecordRecentTemplate({
  id, name, category,
}: { id: string; name: string; category?: string | null }) {
  useEffect(() => {
    recordRecentTemplate({ id, name, category });
  }, [id, name, category]);
  return null;
}
