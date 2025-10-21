'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';
import type { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { FieldSchemaActions } from './actions';

interface FieldSchemaTableProps {
  schemas: MetadataSchema[];
  entityType: EntityType;
  onEdit: (schema: MetadataSchema) => void;
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  isLoading?: boolean;
  isFetching?: boolean;
}

const fieldTypeLabels: Record<string, string> = {
  STRING: 'Text',
  NUMBER: 'Number',
  DATE: 'Date',
  SELECT: 'Select',
  BOOLEAN: 'Boolean',
  TEXT: 'Long Text',
};

const fieldTypeBadgeVariants: Record<string, any> = {
  STRING: 'default',
  NUMBER: 'secondary',
  DATE: 'outline',
  SELECT: 'default',
  BOOLEAN: 'secondary',
  TEXT: 'default',
};

export function FieldSchemaTable({
  schemas,
  entityType,
  onEdit,
  meta,
  isLoading,
  isFetching,
}: FieldSchemaTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = meta?.page || 1;
  const perPage = meta?.perPage || 20;

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/metadata?${params.toString()}`);
  };

  const columns: ColumnDef<MetadataSchema>[] = useMemo(
    () => [
      {
        accessorKey: 'field_key',
        header: () => <div className="text-left">Field Key</div>,
        cell: ({ cell }) => (
          <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
            {cell.getValue<string>()}
          </code>
        ),
      },
      {
        accessorKey: 'field_label',
        header: () => <div className="text-left">Label</div>,
        cell: ({ cell }) => (
          <span className="font-medium">{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'field_type',
        header: () => <div className="text-left">Type</div>,
        cell: ({ cell }) => {
          const type = cell.getValue<string>();
          return (
            <Badge variant={fieldTypeBadgeVariants[type] || 'default'}>
              {fieldTypeLabels[type] || type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'validation_rules.required',
        header: () => <div className="text-left">Required</div>,
        cell: ({ cell, row }) => {
          const isRequired = cell.getValue<boolean>();

          return (
            <Badge variant={isRequired ? 'default' : 'outline'}>
              {isRequired ? 'Yes' : 'No'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'display_order',
        header: () => <div className="text-left">Order</div>,
        cell: ({ cell }) => (
          <span className="text-sm text-muted-foreground">
            {cell.getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: 'validation_rules',
        header: () => <div className="text-left">Validation</div>,
        cell: ({ cell }) => {
          const rules = cell.getValue<Record<string, any>>();
          const count = rules ? Object.keys(rules).length : 0;
          return count > 0 ? (
            <span className="text-sm text-muted-foreground">
              {count} rule{count > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <FieldSchemaActions
            schema={row.original}
            entityType={entityType}
            onEdit={onEdit}
          />
        ),
      },
    ],
    [entityType, onEdit],
  );

  const table = useReactTable({
    data: schemas || [],
    columns,
    pageCount: meta?.totalPages || 0,
    state: {
      pagination: { pageIndex: page - 1, pageSize: perPage },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!isLoading && schemas.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">
            No custom fields defined
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Click "Add Field" to create your first custom field
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No schemas found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{' '}
            {Math.min(page * perPage, meta?.total || 0)} of {meta?.total || 0}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Rows per page selector */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={perPage.toString()}
              onValueChange={(value) =>
                updateUrl({ perPage: value, page: '1' })
              }
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: '1' })}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: (page - 1).toString() })}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm">
              Page {page} of {meta?.totalPages || 1}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: (page + 1).toString() })}
              disabled={page >= (meta?.totalPages || 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateUrl({ page: (meta?.totalPages || 1).toString() })
              }
              disabled={page >= (meta?.totalPages || 1)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
