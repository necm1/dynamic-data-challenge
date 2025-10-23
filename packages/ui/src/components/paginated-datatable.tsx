'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Updater,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from './pagination';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/use-media-query';
import { Skeleton } from './skeleton';
import { cn } from '../lib/utils';

type PDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  setPage: (page: number) => void;
  perPage: number;
  setPerPage: (perPage: number) => void;
  totalPages: number;
  loading?: boolean;
};

function PDataTable<TData, TValue>({
  columns,
  data,
  page,
  setPage,
  perPage,
  setPerPage,
  totalPages = -1,
  loading = true,
}: PDataTableProps<TData, TValue>) {
  const calculateVisiblePages = (
    total: number,
    current: number,
    maxVisible: number,
  ): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const halfRange = Math.floor((maxVisible - 1) / 2);

    let start = Math.max(1, current - halfRange);
    let end = Math.min(total, current + halfRange);

    if (end - start + 1 < maxVisible) {
      if (start === 1) {
        end = Math.min(total, start + maxVisible - 1);
      } else if (end === total) {
        start = Math.max(1, end - maxVisible + 1);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (start > 2) {
      pages.unshift('ellipsis');
      pages.unshift(1);
    } else if (start === 2) {
      pages.unshift(1);
    }

    if (end < total - 1) {
      pages.push('ellipsis');
      pages.push(total);
    } else if (end === total - 1) {
      pages.push(total);
    }

    return pages;
  };

  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const visiblePages = calculateVisiblePages(
    totalPages,
    page,
    isSmallScreen ? 3 : 10,
  );

  const pagination: PaginationState = {
    pageIndex: page - 1,
    pageSize: perPage,
  };

  function onPaginationChange(updaterOrValue: Updater<PaginationState>) {
    if (typeof updaterOrValue === 'function') {
      const newPagination = updaterOrValue(pagination);
      setPage(newPagination.pageIndex + 1);
      setPerPage(newPagination.pageSize);
    } else {
      setPage(updaterOrValue.pageIndex + 1);
      setPerPage(updaterOrValue.pageSize);
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    enableRowSelection: true,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: totalPages,
  });

  if (loading) {
    return (
      <DataTableSkeleton
        searchableColumnCount={1}
        filterableColumnCount={2}
        columnCount={columns.length}
        showViewOptions={false}
        rowCount={perPage}
      />
    );
  }

  return (
    <div>
      <div className="border rounded-lg border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
                  className="h-24 text-center"
                >
                  Keine Ergbenisse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mt-4">
        <div className="flex items-center gap-3">
          <Label htmlFor="rows-per-page">Zeilen pro Seite</Label>
          <Select
            defaultValue={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger
              id="rows-per-page"
              className="w-fit whitespace-nowrap"
            >
              <SelectValue placeholder="Wähle die Anzahl der Ergbenissen" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex grow justify-end whitespace-nowrap text-sm text-muted-foreground">
            <p
              className="whitespace-nowrap text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span className="text-foreground">
                {page}-{perPage}
              </span>{' '}
              von <span className="text-foreground">{totalPages}</span>
            </p>
          </div>
        </div>

        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationLink
                  onClick={() => table.firstPage()}
                  className="hidden sm:inline-flex"
                  role={table.getCanPreviousPage() ? 'link' : undefined}
                >
                  <ChevronFirst size={16} strokeWidth={2} aria-hidden="true" />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  onClick={() => table.previousPage()}
                  role={table.getCanPreviousPage() ? 'link' : undefined}
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </PaginationLink>
              </PaginationItem>

              {visiblePages.map((p, index) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationLink
                  onClick={() => table.nextPage()}
                  role={table.getCanNextPage() ? 'link' : undefined}
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </PaginationLink>
              </PaginationItem>

              <PaginationItem>
                <PaginationLink
                  onClick={() => table.lastPage()}
                  className="hidden sm:inline-flex"
                  role={table.getCanNextPage() ? 'link' : undefined}
                >
                  <ChevronLast size={16} strokeWidth={2} aria-hidden="true" />
                </PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}

export function useDataTableSource<T>(
  fetchMethod: unknown,
  initialPage = 1,
  initialPerPage = 10,
  ...params: unknown
) {
  const [page, setPage] = useState(initialPage);
  const [perPage, setPerPage] = useState(initialPerPage);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const response = await fetchMethod({ params, page, perPage });

    setData(response.data);
    setPage(response.meta?.page);
    setPerPage(response.meta?.perPage);
    setTotal(response.meta?.totalPages === 0 ? 1 : response.meta?.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, perPage]);

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    data,
    total,
    loading,
    refresh: fetchData,
  };
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  reload: boolean;
  fetchMethod?: unknown;
  fetchParams?: unknown[];
  initialPage?: number;
  initialPerPage?: number;
};

export const DataTable = forwardRef(
  (
    {
      columns,
      reload,
      fetchMethod,
      fetchParams,
      initialPage = 1,
      initialPerPage = 10,
    }: DataTableProps<unknown, unknown>,
    ref?: React.Ref<{ refresh: () => void }>,
  ) => {
    const {
      data,
      page,
      setPage,
      perPage,
      setPerPage,
      total,
      loading,
      refresh,
    } = useDataTableSource(
      fetchMethod,
      initialPage,
      initialPerPage,
      fetchParams,
    );

    useEffect(() => {
      if (reload) {
        refresh();
      }
    }, [reload, refresh]);

    useImperativeHandle(ref, () => ({
      refresh,
    }));

    return (
      <PDataTable
        columns={columns as unknown}
        data={data}
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        totalPages={total}
        loading={loading}
      />
    );
  },
);

interface DataTableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The number of columns in the table.
   * @type number
   */
  columnCount: number;

  /**
   * The number of rows in the table.
   * @default 10
   * @type number | undefined
   */
  rowCount?: number;

  /**
   * The number of searchable columns in the table.
   * @default 0
   * @type number | undefined
   */
  searchableColumnCount?: number;

  /**
   * The number of filterable columns in the table.
   * @default 0
   * @type number | undefined
   */
  filterableColumnCount?: number;

  /**
   * Flag to show the table view options.
   * @default undefined
   * @type boolean | undefined
   */
  showViewOptions?: boolean;

  /**
   * The width of each cell in the table.
   * The length of the array should be equal to the columnCount.
   * any valid CSS width value is accepted.
   * @default ["auto"]
   * @type string[] | undefined
   */
  cellWidths?: string[];

  /**
   * Flag to show the pagination bar.
   * @default true
   * @type boolean | undefined
   */
  withPagination?: boolean;

  /**
   * Flag to prevent the table cells from shrinking.
   * @default false
   * @type boolean | undefined
   */
  shrinkZero?: boolean;
}

export function DataTableSkeleton(props: DataTableSkeletonProps) {
  const {
    columnCount,
    rowCount = 10,
    searchableColumnCount = 0,
    filterableColumnCount = 0,
    showViewOptions = true,
    cellWidths = ['auto'],
    withPagination = true,
    shrinkZero = false,
    className,
    ...skeletonProps
  } = props;

  return (
    <div
      className={cn('w-full space-y-2.5 overflow-auto', className)}
      {...skeletonProps}
    >
      <div className="flex w-full items-center justify-between space-x-2 overflow-auto p-1">
        <div className="flex flex-1 items-center space-x-2">
          {searchableColumnCount > 0
            ? Array.from({ length: searchableColumnCount }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-40 lg:w-60" />
              ))
            : null}
          {filterableColumnCount > 0
            ? Array.from({ length: filterableColumnCount }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-[4.5rem] border-dashed" />
              ))
            : null}
        </div>
        {showViewOptions ? (
          <Skeleton className="ml-auto hidden h-7 w-[4.5rem] lg:flex" />
        ) : null}
      </div>
      <div className="border rounded-lg border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            {Array.from({ length: 1 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableHead
                    key={j}
                    style={{
                      width: cellWidths[j],
                      minWidth: shrinkZero ? cellWidths[j] : 'auto',
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, j) => (
                  <TableCell
                    key={j}
                    style={{
                      width: cellWidths[j],
                      minWidth: shrinkZero ? cellWidths[j] : 'auto',
                    }}
                  >
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {withPagination ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mt-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40 shrink-0" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-24" />

            <div className="flex items-center space-x-2">
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="h-7 w-[4.5rem]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
