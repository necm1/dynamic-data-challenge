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
  getListings,
  deleteListing,
  type Listing,
  type PaginatedListings,
  type FindListingsParams,
} from '@repo/web-utils/actions/listings';
import { ListingView } from '../view';
import { createListingColumns } from './columns';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';

type ListingTableProps = {
  initialData: PaginatedListings;
  schemas: MetadataSchema[];
};

export function ListingTable({ initialData, schemas }: ListingTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [viewListing, setViewListing] = useState<Listing | undefined>(
    undefined,
  );

  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 20;

  const filterParams = useMemo<FindListingsParams>(() => {
    const params: FindListingsParams = {};
    const status = searchParams.get('status');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const property_id = searchParams.get('property_id');
    const customFields = searchParams.get('customFields');

    if (status) params.status = Number(status);
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    if (property_id) params.property_id = property_id;
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
    queryKey: ['listings', page, perPage, filterParams],
    queryFn: () => getListings({ page, perPage, ...filterParams }),
    initialData,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete listing "${title}"? This cannot be undone.`)) return;
    await deleteMutation.mutateAsync(id);
  };

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/listings?${params.toString()}`);
  };

  const handleListingView = (
    listing: Listing,
    mode: 'view' | 'edit' = 'view',
  ) => {
    setViewListing(listing);
    setViewOpen(true);
  };

  const columns = createListingColumns({
    schemas,
    onViewDetails: (listing, mode) => handleListingView(listing, mode),
    onEditMetadata: (listing) => handleListingView(listing, 'edit'),
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
      <ListingView
        listing={viewListing}
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
                  No listings found
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
