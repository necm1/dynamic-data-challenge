'use client';

import { useMemo, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { PropertiesFilterBar } from './properties-filter-bar';
import {
  getProperties,
  deleteProperty,
  type PropertyFilterParams,
} from '@repo/web-utils/actions/properties';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  MetadataSchema,
  PaginatedResponse,
} from '@repo/web-utils/actions/metadata';

type Property = {
  id: string;
  title: string;
  address: string;
  price: number;
  year_built: number;
  custom_fields: Record<string, any>;
};

type PropertiesTableProps = {
  initialData: PaginatedResponse<Property>;
  schemas: MetadataSchema[];
};

export function PropertiesTable({
  initialData,
  schemas,
}: PropertiesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Parse URL params
  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 20;

  const filterParams = useMemo<PropertyFilterParams>(() => {
    const params: PropertyFilterParams = {};
    const title = searchParams.get('title');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const customFields = searchParams.get('customFields');

    if (title) params.title = title;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
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
    queryKey: ['properties', page, perPage, filterParams],
    queryFn: () => getProperties({ params: [filterParams], page, perPage }),
    initialData,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/properties?${params.toString()}`);
  };

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: 'title',
      header: () => <div className="text-left">Title</div>,
      cell: ({ row }) => (
        <Link
          href={`/properties/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue('title')}
        </Link>
      ),
    },
    {
      accessorKey: 'address',
      header: () => <div className="text-left">Address</div>,
      cell: ({ cell }) => (
        <div className="text-sm text-muted-foreground">
          {cell.getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: () => <div className="text-left">Price</div>,
      cell: ({ cell }) => (
        <div className="font-semibold">
          ${cell.getValue<number>().toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'year_built',
      header: () => <div className="text-left">Year</div>,
    },
    {
      accessorKey: 'custom_fields',
      header: () => <div className="text-left">Custom Fields</div>,
      cell: ({ row }) => {
        const fields = row.getValue('custom_fields') as Record<string, any>;
        const entries = Object.entries(fields || {});
        if (entries.length === 0)
          return <span className="text-xs text-muted-foreground">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {entries.slice(0, 2).map(([k, v]) => (
              <Badge key={k} variant="secondary" className="text-xs">
                {k}: {String(v).slice(0, 10)}
              </Badge>
            ))}
            {entries.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{entries.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/properties/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/properties/${row.original.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() =>
                  handleDelete(row.original.id, row.original.title)
                }
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    pageCount: data?.meta?.totalPages || 0,
    state: {
      pagination: { pageIndex: page - 1, pageSize: perPage },
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const meta = data?.meta || { total: 0, page: 1, perPage: 20, totalPages: 1 };

  return (
    <div className="space-y-4">
      <PropertiesFilterBar schemas={schemas} />

      <div className="rounded-md border relative">
        {isHydrated && isFetching && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <Table>
          <TableHeader>
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
                  No properties found
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * perPage + 1} to{' '}
            {Math.min(page * perPage, meta.total)} of {meta.total}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={perPage.toString()}
              onValueChange={(value) =>
                updateUrl({ perPage: value, page: '1' })
              }
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={perPage} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: '1' })}
              disabled={page === 1 || (isHydrated && isFetching)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: (page - 1).toString() })}
              disabled={page === 1 || (isHydrated && isFetching)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {meta.totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: (page + 1).toString() })}
              disabled={page >= meta.totalPages || (isHydrated && isFetching)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateUrl({ page: meta.totalPages.toString() })}
              disabled={page >= meta.totalPages || (isHydrated && isFetching)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
