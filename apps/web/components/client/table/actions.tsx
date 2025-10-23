'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Button } from '@repo/ui/components/button';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { type Client } from '@repo/web-utils/actions/clients';
import Link from 'next/link';

type ClientTableActionsProps = {
  client: Client;
  handleDelete: (id: string, name: string) => Promise<void>;
  handleClientView?: (client: Client, mode: 'edit') => void;
};

export function ClientTableActions({
  client,
  handleDelete,
  handleClientView,
}: ClientTableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant={'outline'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleClientView?.(client, 'edit')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant={'destructive'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleDelete?.(client.id, client.name)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
