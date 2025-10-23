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
import { type Listing } from '@repo/web-utils/actions/listings';
import Link from 'next/link';

type ListingTableActionsProps = {
  listing: Listing;
  handleDelete: (id: string, title: string) => Promise<void>;
  handleListingView?: (listing: Listing, mode: 'edit') => void;
};

export function ListingTableActions({
  listing,
  handleDelete,
  handleListingView,
}: ListingTableActionsProps) {
  const displayTitle = listing.property?.title || listing.id.slice(0, 8);

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant={'outline'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleListingView?.(listing, 'edit')}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant={'destructive'}
        size={'icon'}
        className="h-8 w-8 cursor-pointer"
        onClick={() => handleDelete?.(listing.id, displayTitle)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
