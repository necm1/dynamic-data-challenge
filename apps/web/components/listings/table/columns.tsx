'use client';

import { ColumnDef } from '@tanstack/react-table';
import { type Listing } from '@repo/web-utils/actions/listings';
import { formatDistanceToNow } from 'date-fns';
import { ListingTableActions } from './actions';
import { TableCustomFieldsProps } from '../../custom-fields';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { ListingStatus } from '@repo/shared';
import { Badge } from '@repo/ui/components/badge';

type ListingColumnProps = {
  schemas: MetadataSchema[];
  onViewDetails: (listing: Listing, mode: 'edit' | 'view') => void;
  onEditMetadata: (listing: Listing) => void;
  onDelete: (id: string, title: string) => Promise<void>;
};

const statusLabels = {
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.PENDING]: 'Pending',
  [ListingStatus.SOLD]: 'Sold',
};

const statusVariants = {
  [ListingStatus.ACTIVE]: 'default',
  [ListingStatus.PENDING]: 'secondary',
  [ListingStatus.SOLD]: 'outline',
} as const;

export function createListingColumns({
  schemas,
  onViewDetails,
  onEditMetadata,
  onDelete,
}: ListingColumnProps): ColumnDef<Listing>[] {
  return [
    {
      accessorKey: 'property.title',
      header: () => <div className="text-left">Property</div>,
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer hover:underline"
          onClick={() => onViewDetails?.(row.original, 'edit')}
        >
          {row.original.property?.title || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-left">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as ListingStatus;
        return (
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        );
      },
    },
    {
      accessorKey: 'price',
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        const price = row.getValue('price') as number;
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: 'property.address',
      header: () => <div className="text-left">Address</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.original.property?.address || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'metadata',
      header: () => <div className="text-left">Custom Fields</div>,
      cell: ({ row }) => (
        <TableCustomFieldsProps
          schemas={schemas}
          customFields={row.getValue('metadata')}
          maxVisible={2}
        />
      ),
    },
    {
      accessorKey: 'created_at',
      header: () => <div className="text-left">Created</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <ListingTableActions
          listing={row.original}
          handleDelete={onDelete}
          handleListingView={onViewDetails}
        />
      ),
    },
  ];
}
