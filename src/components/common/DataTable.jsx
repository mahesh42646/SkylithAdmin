'use client';

import { useState, useMemo } from 'react';

export default function DataTable({ 
  columns, 
  data, 
  searchable = true, 
  pagination = true, 
  pageSize = 10,
  actions = null 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = data.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns]);

  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="card">
      <div className="card-body">
        {searchable && (
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={{ cursor: col.sortable !== false ? 'pointer' : 'default' }}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    {col.label}
                    {sortConfig.key === col.key && (
                      <span className="ms-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
                {actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-muted py-4">
                    No data found
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={row.id || idx}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    {actions && (
                      <td>
                        {actions(row)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted small">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                    Previous
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

