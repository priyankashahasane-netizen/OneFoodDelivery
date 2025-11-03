"use client";

import { useEffect, useState } from 'react';
import { getToken } from '../lib/auth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const t = getToken();
    if (!t) {
      window.location.href = '/login';
    } else {
      setOk(true);
    }
  }, []);
  if (!ok) return null;
  return <>{children}</>;
}



