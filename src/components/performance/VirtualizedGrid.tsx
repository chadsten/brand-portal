"use client";

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  columnCount: number;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  loadMore?: () => Promise<void>;
  hasNextPage?: boolean;
  isLoading?: boolean;
  className?: string;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemWidth,
  columnCount,
  renderItem,
  loadMore,
  hasNextPage = false,
  isLoading = false,
  className = "",
  gap = 16,
}: VirtualizedGridProps<T>) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate responsive column count
  const responsiveColumnCount = useMemo(() => {
    if (containerSize.width === 0) return columnCount;
    const availableWidth = containerSize.width - gap;
    const itemWithGap = itemWidth + gap;
    const possibleColumns = Math.floor(availableWidth / itemWithGap);
    return Math.max(1, Math.min(possibleColumns, columnCount));
  }, [containerSize.width, itemWidth, columnCount, gap]);

  const rowCount = Math.ceil(items.length / responsiveColumnCount);
  const actualItemWidth = useMemo(() => {
    if (containerSize.width === 0) return itemWidth;
    const availableWidth = containerSize.width - (gap * (responsiveColumnCount - 1));
    return Math.floor(availableWidth / responsiveColumnCount);
  }, [containerSize.width, responsiveColumnCount, gap, itemWidth]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Grid cell renderer
  const GridCell = useCallback(({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const itemIndex = rowIndex * responsiveColumnCount + columnIndex;
    const item = items[itemIndex];

    if (!item) {
      return <div style={style} />;
    }

    const cellStyle = {
      ...style,
      left: Number(style.left) + (columnIndex * gap),
      top: Number(style.top) + (rowIndex * gap),
      width: actualItemWidth,
      height: itemHeight - gap,
    };

    return renderItem({ item, index: itemIndex, style: cellStyle });
  }, [items, responsiveColumnCount, gap, actualItemWidth, itemHeight, renderItem]);

  // Infinite loading
  const isItemLoaded = useCallback((index: number) => {
    return index < items.length;
  }, [items.length]);

  const loadMoreItems = useCallback(async () => {
    if (loadMore && !isLoading) {
      await loadMore();
    }
  }, [loadMore, isLoading]);

  if (containerSize.width === 0) {
    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-default-500">Loading...</div>
        </div>
      </div>
    );
  }

  const gridHeight = Math.min(containerSize.height, (rowCount * (itemHeight + gap)) - gap);

  if (loadMore && hasNextPage) {
    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={hasNextPage ? items.length + 1 : items.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <Grid
              ref={ref}
              height={gridHeight}
              width={containerSize.width}
              columnCount={responsiveColumnCount}
              columnWidth={actualItemWidth + gap}
              rowCount={hasNextPage ? rowCount + 1 : rowCount}
              rowHeight={itemHeight + gap}
              onItemsRendered={({
                visibleRowStartIndex,
                visibleRowStopIndex,
                visibleColumnStartIndex,
                visibleColumnStopIndex,
              }) => {
                onItemsRendered({
                  startIndex: visibleRowStartIndex * responsiveColumnCount + visibleColumnStartIndex,
                  stopIndex: visibleRowStopIndex * responsiveColumnCount + visibleColumnStopIndex,
                });
              }}
            >
              {GridCell}
            </Grid>
          )}
        </InfiniteLoader>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <Grid
        height={gridHeight}
        width={containerSize.width}
        columnCount={responsiveColumnCount}
        columnWidth={actualItemWidth + gap}
        rowCount={rowCount}
        rowHeight={itemHeight + gap}
      >
        {GridCell}
      </Grid>
    </div>
  );
}

// Virtualized List component for single column layouts
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  loadMore?: () => Promise<void>;
  hasNextPage?: boolean;
  isLoading?: boolean;
  className?: string;
  estimatedItemSize?: number;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  loadMore,
  hasNextPage = false,
  isLoading = false,
  className = "",
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  const [containerHeight, setContainerHeight] = useState(400);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const ListItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) {
      return (
        <div style={style} className="flex items-center justify-center">
          <div className="text-default-500">Loading...</div>
        </div>
      );
    }

    return renderItem({ item, index, style });
  }, [items, renderItem]);

  const isItemLoaded = useCallback((index: number) => {
    return index < items.length;
  }, [items.length]);

  const loadMoreItems = useCallback(async () => {
    if (loadMore && !isLoading) {
      await loadMore();
    }
  }, [loadMore, isLoading]);

  if (loadMore && hasNextPage) {
    return (
      <div ref={containerRef} className={`w-full h-full ${className}`}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={hasNextPage ? items.length + 1 : items.length}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={ref}
              height={containerHeight}
              itemCount={hasNextPage ? items.length + 1 : items.length}
              itemSize={itemHeight}
              onItemsRendered={onItemsRendered}
              overscanCount={overscanCount}
            >
              {ListItem}
            </List>
          )}
        </InfiniteLoader>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <List
        height={containerHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscanCount}
      >
        {ListItem}
      </List>
    </div>
  );
}