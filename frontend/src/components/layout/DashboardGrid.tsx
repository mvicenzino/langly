import type { ReactNode } from 'react';
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout, LayoutItem } from 'react-grid-layout';
import { useLayoutStore } from '../../store/layoutStore';

interface Props {
  children: ReactNode;
}

// Panels that go left in medium layout
const leftPanels = new Set(['stocks', 'todos', 'skills', 'openclaw']);

export function DashboardGrid({ children }: Props) {
  const layouts = useLayoutStore((s) => s.layouts);
  const setLayouts = useLayoutStore((s) => s.setLayouts);
  const { width, containerRef, mounted } = useContainerWidth();

  const responsiveLayouts = {
    lg: layouts as Layout,
    md: layouts.map((l: LayoutItem) => ({
      ...l,
      w: l.i === 'chat' ? 12 : 6,
      x: l.i === 'chat' ? 0 : leftPanels.has(l.i) ? 0 : 6,
    })) as Layout,
    sm: layouts.map((l: LayoutItem) => ({ ...l, w: 12, x: 0 })) as Layout,
  };

  function handleLayoutChange(layout: Layout) {
    setLayouts([...layout] as LayoutItem[]);
  }

  return (
    <div ref={containerRef}>
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={responsiveLayouts}
          breakpoints={{ lg: 1200, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 12, sm: 12 }}
          rowHeight={60}
          dragConfig={{ handle: '.widget-drag-handle' }}
          onLayoutChange={handleLayoutChange}
          compactor={verticalCompactor}
          margin={[12, 12]}
        >
          {children}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
