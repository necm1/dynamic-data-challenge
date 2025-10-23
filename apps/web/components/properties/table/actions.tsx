'use client';

import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { Property } from '@repo/web-utils/lib/schemas/property.schema';
import Link from 'next/link';

type PropertiesTableActionsProps = {
  property: Property;
  handleDelete: (id: string, title: string) => void;
  handleView?: () => void;
};

export function PropertiesTableActions({
  property,
  handleDelete,
  handleView,
}: PropertiesTableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant={'outline'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleView?.()}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant={'destructive'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleDelete?.(property.id, property.title)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
