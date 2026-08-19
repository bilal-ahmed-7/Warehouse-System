import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ currentPage, totalCount, pageSize, onPageChange, onPageSizeChange }) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (totalCount <= 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.85rem',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</strong> - <strong>{Math.min(currentPage * pageSize, totalCount)}</strong> of <strong>{totalCount}</strong> items</span>
        {onPageSizeChange && (
          <select
            className="form-control"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <span style={{ fontWeight: 600, padding: '0 8px', color: 'var(--text-primary)' }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
