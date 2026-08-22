'use client';

import { useEffect, useState } from 'react';

export default function Horloge() {
  const [maintenant, setMaintenant] = useState(null);

  useEffect(() => {
    setMaintenant(new Date());
    const intervalle = setInterval(() => setMaintenant(new Date()), 1000);
    return () => clearInterval(intervalle);
  }, []);

  if (!maintenant) return null;

  const date = maintenant.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const heure = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="sidebar-horloge">
      <span className="sidebar-horloge-date">{date}</span>
      <span className="sidebar-horloge-heure">{heure}</span>
    </div>
  );
}
