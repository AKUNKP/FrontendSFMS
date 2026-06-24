import React from "react";
import { cn } from "../utils/classNames";

function Table({ columns, rows, rowKey, sortKey, sortDirection, onSort }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3">
                {column.sortable && onSort ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className={cn(
                      "group inline-flex items-center gap-2 transition",
                      sortKey === column.key ? "text-slate-700" : "text-slate-500"
                    )}
                  >
                    <span>{column.label}</span>
                    <svg
                      viewBox="0 0 16 16"
                      className={cn(
                        "h-3 w-3",
                        sortKey === column.key ? "text-slate-600" : "text-slate-300 group-hover:text-slate-400"
                      )}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    >
                      <path
                        d="M4.5 6 8 2.5 11.5 6"
                        className={cn(
                          sortKey === column.key && sortDirection === "asc"
                            ? "opacity-100"
                            : "opacity-40"
                        )}
                      />
                      <path
                        d="M4.5 10 8 13.5 11.5 10"
                        className={cn(
                          sortKey === column.key && sortDirection === "desc"
                            ? "opacity-100"
                            : "opacity-40"
                        )}
                      />
                    </svg>
                  </button>
                ) : (
                  <span>{column.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-slate-50/80">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
