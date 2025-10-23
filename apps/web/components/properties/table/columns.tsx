'use client';

import { ColumnDef } from '@tanstack/react-table';
import { TableCustomFieldsProps } from '../../custom-fields';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { PropertiesTableActions } from './actions';
import type { Property } from '@repo/web-utils/lib/schemas/property.schema';

type PropertyColumnProps = {
  schemas: MetadataSchema[];
  onViewDetails: (property: Property, mode: 'edit' | 'view') => void;
  onDelete: (id: string, title: string) => Promise<void>;
};

export function createPropertyColumns({
  schemas,
  onViewDetails,
  onDelete,
}: PropertyColumnProps): ColumnDef<Property>[] {
  return [
    {
      accessorKey: 'title',
      header: () => <div className="text-left">Title</div>,
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer hover:underline"
          onClick={() => onViewDetails?.(row.original, 'edit')}
        >
          {row.getValue('title')}
        </div>
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
      cell: ({ row }) => (
        <TableCustomFieldsProps
          schemas={schemas}
          customFields={row.getValue('custom_fields')}
          maxVisible={2}
        />
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <PropertiesTableActions
          property={row.original}
          handleDelete={onDelete}
          handleView={() => onViewDetails?.(row.original, 'edit')}
        />
      ),
    },
  ];
}
