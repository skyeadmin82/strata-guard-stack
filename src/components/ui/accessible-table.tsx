import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AccessibleTableProps {
  children: React.ReactNode;
  className?: string;
  caption?: string;
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  children,
  className,
  caption,
  sortable = false,
  onSort
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [currentSort, setCurrentSort] = React.useState<{ column: string; direction: 'asc' | 'desc' } | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!tableRef.current) return;

    const target = e.target as HTMLElement;
    
    // Handle arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      
      const cells = Array.from(tableRef.current.querySelectorAll('td, th'));
      const currentIndex = cells.indexOf(target);
      
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      const columns = tableRef.current.querySelectorAll('thead th').length;
      
      switch (e.key) {
        case 'ArrowUp':
          nextIndex = Math.max(0, currentIndex - columns);
          break;
        case 'ArrowDown':
          nextIndex = Math.min(cells.length - 1, currentIndex + columns);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowRight':
          nextIndex = Math.min(cells.length - 1, currentIndex + 1);
          break;
      }
      
      if (nextIndex !== currentIndex && cells[nextIndex]) {
        (cells[nextIndex] as HTMLElement).focus();
      }
    }
    
    // Handle sorting with Enter/Space on header cells
    if (sortable && (e.key === 'Enter' || e.key === ' ') && target.tagName === 'TH') {
      e.preventDefault();
      const column = target.textContent || '';
      
      let direction: 'asc' | 'desc' = 'asc';
      if (currentSort?.column === column && currentSort?.direction === 'asc') {
        direction = 'desc';
      }
      
      setCurrentSort({ column, direction });
      onSort?.(column, direction);
      
      // Announce sort change
      const announcement = `Table sorted by ${column} in ${direction === 'asc' ? 'ascending' : 'descending'} order`;
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      document.body.appendChild(liveRegion);
      
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, 1000);
    }
  }, [sortable, onSort, currentSort]);

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    // Make table cells focusable
    const cells = table.querySelectorAll('td, th');
    cells.forEach((cell, index) => {
      (cell as HTMLElement).tabIndex = index === 0 ? 0 : -1;
    });

    table.addEventListener('keydown', handleKeyDown);
    return () => table.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <table
      ref={tableRef}
      className={cn("w-full border-collapse", className)}
      role="table"
      aria-label={caption || "Data table"}
    >
      {caption && (
        <caption className="sr-only">
          {caption}
          {sortable && " (Use arrow keys to navigate, Enter or Space to sort columns)"}
        </caption>
      )}
      {children}
    </table>
  );
};

export const AccessibleTableHeader: React.FC<{ children: React.ReactNode; sortable?: boolean }> = ({ 
  children, 
  sortable = false 
}) => (
  <thead>
    <tr>
      {React.Children.map(children, (child) =>
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<any>, {
              role: "columnheader",
              tabIndex: 0,
              ...(sortable && {
                "aria-sort": "none",
                style: { cursor: "pointer" }
              })
            })
          : child
      )}
    </tr>
  </thead>
);

export const AccessibleTableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody role="rowgroup">
    {children}
  </tbody>
);

export const AccessibleTableRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr role="row">
    {children}
  </tr>
);

export const AccessibleTableCell: React.FC<{ 
  children: React.ReactNode; 
  header?: boolean;
  className?: string;
}> = ({ children, header = false, className }) => {
  const Component = header ? 'th' : 'td';
  return (
    <Component
      className={cn(
        "border px-4 py-2 text-left",
        header && "font-medium bg-muted",
        className
      )}
      role={header ? "columnheader" : "cell"}
    >
      {children}
    </Component>
  );
};