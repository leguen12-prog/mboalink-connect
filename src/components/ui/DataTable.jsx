import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from 'framer-motion';

export default function DataTable({ 
  columns, 
  data, 
  isLoading, 
  emptyMessage = "No data found",
  onRowClick,
  rowClassName = ""
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/30 border-slate-800/50 hover:bg-slate-800/30">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-slate-400 font-medium">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="border-slate-800/50">
                {columns.map((col, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full bg-slate-800" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/30 border-slate-800/50 hover:bg-slate-800/30">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-slate-400 font-medium">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/30 border-slate-800/50 hover:bg-slate-800/30">
            {columns.map((col, i) => (
              <TableHead key={i} className={`text-slate-400 font-medium ${col.className || ''}`}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <motion.tr
              key={row.id || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-slate-800/50 transition-colors hover:bg-slate-800/30 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
            >
              {columns.map((col, j) => (
                <TableCell key={j} className={`text-slate-300 ${col.cellClassName || ''}`}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}