import { useState, useEffect } from 'react';
import { fetchSkills } from '../api/skills';
import type { Skill } from '../types/skills';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkills()
      .then(setSkills)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { skills, loading };
}
