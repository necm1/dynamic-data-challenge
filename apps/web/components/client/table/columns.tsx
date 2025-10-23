'use client';

import { ColumnDef } from '@tanstack/react-table';
import { type Client } from '@repo/web-utils/actions/clients';
import { formatDistanceToNow } from 'date-fns';
import { ClientTableActions } from './actions';
import { TableCustomFieldsProps } from '../../custom-fields';
import { MetadataSchema } from '@repo/web-utils/actions/metadata';

type ClientColumnProps = {
  schemas: MetadataSchema[];
  onViewDetails: (client: Client, mode: 'edit' | 'view') => void;
  onEditMetadata: (client: Client) => void;
  onDelete: (id: string, name: string) => Promise<void>;
};

export function createClientColumns({
  schemas,
  onViewDetails,
  onEditMetadata,
  onDelete,
}: ClientColumnProps): ColumnDef<Client>[] {
  return [
    {
      accessorKey: 'name',
      header: () => <div className="text-left">Name</div>,
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer hover:underline"
          onClick={() => onViewDetails?.(row.original, 'edit')}
        >
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: () => <div className="text-left">Address</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'phone',
      header: () => <div className="text-left">Phone</div>,
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string | undefined;
        return (
          <div className="text-muted-foreground">
            {phone || <span className="text-xs">-</span>}
          </div>
        );
      },
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
        <ClientTableActions
          client={row.original}
          handleDelete={onDelete}
          handleClientView={onViewDetails}
        />
      ),
    },
  ];
}
