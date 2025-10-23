'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
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
import {
  getClients,
  deleteClient,
  type Client,
  type PaginatedClients,
  type FindClientsParams,
} from '@repo/web-utils/actions/clients';
import { ClientView } from '../view';
import { createClientColumns } from './columns';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';

type ClientTableProps = {
  initialData: PaginatedClients;
  schemas: MetadataSchema[];
};

export function ClientTable({ initialData, schemas }: ClientTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [viewClient, setViewClient] = useState<Client | undefined>(undefined);

  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 20;

  const filterParams = useMemo<FindClientsParams>(() => {
    const params: FindClientsParams = {};
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const customFields = searchParams.get('customFields');

    if (name) params.name = name;
    if (email) params.email = email;
    if (customFields) {
      try {
        params.customFields = JSON.parse(customFields);
      } catch (e) {
        console.error('Invalid customFields:', e);
      }
    }
    return params;
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', page, perPage, filterParams],
    queryFn: () => getClients({ page, perPage, ...filterParams }),
    initialData,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/clients?${params.toString()}`);
  };

  const handleClientView = (client: Client, mode: 'view' | 'edit' = 'view') => {
    setViewClient(client);
    setViewOpen(true);
  };

  const columns = createClientColumns({
    schemas,
    onViewDetails: (client, mode) => handleClientView(client, mode),
    onEditMetadata: (client) => handleClientView(client, 'edit'),
    onDelete: handleDelete,
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: data?.meta.totalPages ?? 0,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: perPage,
      },
    },
  });

  return (
    <div className="space-y-4">
      <ClientView
        client={viewClient}
        schemas={schemas}
        open={viewOpen}
        setOpen={setViewOpen}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {isLoading || isFetching ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No clients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing{' '}
          {data?.meta ? (
            <>
              {(data.meta.page - 1) * data.meta.perPage + 1} to{' '}
              {Math.min(data.meta.page * data.meta.perPage, data.meta.total)} of{' '}
              {data.meta.total}
            </>
          ) : (
            '...'
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page</span>
            <Select
              value={String(perPage)}
              onValueChange={(value) =>
                updateUrl({ perPage: value, page: '1' })
              }
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
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
              onClick={() => updateUrl({ page: String(page - 1) })}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-sm">
                Page {page} of {data?.meta.totalPages ?? 1}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: String(page + 1) })}
              disabled={page >= (data?.meta.totalPages ?? 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                updateUrl({ page: String(data?.meta.totalPages ?? 1) })
              }
              disabled={page >= (data?.meta.totalPages ?? 1)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
