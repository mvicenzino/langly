import type { ReactNode } from 'react';
import { useCallback } from 'react';
import { ResponsiveGridLayout, useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { Layout, ResponsiveLayouts } from 'react-grid-layout';
import { useLayoutStore } from '../../store/layoutStore';
import { PAGE_LAYOUTS } from '../../config/widgetLayouts';

interface Props {
  pageId: string;
  children: ReactNode;
}

type BK = 'lg' | 'md' | 'sm';

export function WidgetGrid({ pageId, children }: Props) {
  const getPageLayouts = useLayoutStore((s) => s.getPageLayouts);
  const setPageLayouts = useLayoutStore((s) => s.setPageLayouts);
  const { width, containerRef, mounted } = useContainerWidth();

  const pageConfig = PAGE_LAYOUTS[pageId];
  const rowHeight = pageConfig?.rowHeight ?? 61;
  const layouts = getPageLayouts(pageId);

  const handleLayoutChange = useCallback(
    (_layout: Layout, allLayouts: ResponsiveLayouts<BK>) => {
      setPageLayouts(pageId, allLayouts);
    },
    [pageId, setPageLayouts]
  );

  return (
    <div ref={containerRef}>
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={{ lg: 1280, md: 768, sm: 0 }}
          cols={{ lg: 12, md: 12, sm: 12 }}
          rowHeight={rowHeight}
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
