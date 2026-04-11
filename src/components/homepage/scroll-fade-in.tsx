'use client';

import { useEffect } from 'react';

export function ScrollFadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.homepage-fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
