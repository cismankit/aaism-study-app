import { useState, useCallback, useEffect, useRef, type CSSProperties, type MouseEvent, type RefObject } from 'react';

const DOCK_SIGMA = 36;
const DOCK_MAX_BOOST = 0.32;
const DOCK_ACTIVE_SCALE = 1.12;
const DOCK_LIFT_MAX = 4;

function computeDockStyle(
  element: HTMLElement,
  mouseY: number | null,
  isActive: boolean,
): CSSProperties {
  let scale = isActive ? DOCK_ACTIVE_SCALE : 1;
  let translateY = isActive ? -3 : 0;

  if (mouseY !== null) {
    const rect = element.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const distance = Math.abs(mouseY - centerY);
    const influence = Math.exp(-(distance * distance) / (2 * DOCK_SIGMA * DOCK_SIGMA));
    const hoverScale = 1 + influence * DOCK_MAX_BOOST;
    scale = Math.max(scale, hoverScale);
    translateY = Math.min(translateY, -influence * DOCK_LIFT_MAX);
  }

  return {
    transform: `scale(${scale}) translateY(${translateY}px)`,
  };
}

export function useSidebarDock(collapsed: boolean, activePath: string) {
  const navRef = useRef<HTMLElement>(null);
  const [styleMap, setStyleMap] = useState<Map<string, CSSProperties>>(new Map());

  const updateDock = useCallback(
    (mouseY: number | null) => {
      if (!collapsed || !navRef.current) {
        setStyleMap(new Map());
        return;
      }

      const items = navRef.current.querySelectorAll<HTMLElement>('[data-dock-item]');
      const next = new Map<string, CSSProperties>();

      items.forEach(el => {
        const to = el.dataset.dockItem;
        if (!to) return;
        const isActive = el.dataset.dockActive === 'true';
        next.set(to, computeDockStyle(el, mouseY, isActive));
      });

      setStyleMap(next);
    },
    [collapsed],
  );

  useEffect(() => {
    updateDock(null);
  }, [collapsed, activePath, updateDock]);

  const dockHandlers = collapsed
    ? {
        onMouseMove: (e: MouseEvent<HTMLElement>) => updateDock(e.clientY),
        onMouseLeave: () => updateDock(null),
      }
    : {};

  const getDockStyle = useCallback(
    (to: string): CSSProperties | undefined => styleMap.get(to),
    [styleMap],
  );

  return { navRef: navRef as RefObject<HTMLElement>, getDockStyle, dockHandlers };
}
