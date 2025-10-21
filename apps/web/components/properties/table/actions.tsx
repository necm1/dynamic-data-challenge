'use client';

import { UseMutationResult } from '@tanstack/react-query';
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
import { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { PropertyView } from '../property-view';
import { Fragment, useState } from 'react';

type PropertiesTableActionsProps = {
  property: Property;
  schemas: MetadataSchema[];
  handleDelete: (id: string, title: string) => void;
  deleteMutation: UseMutationResult<void, Error, string, unknown>;
};

export function PropertiesTableActions({
  property,
  schemas,
  handleDelete,
  deleteMutation,
}: PropertiesTableActionsProps) {
  const [openPreview, setOpenPreview] = useState<boolean>(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/properties/${property.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenPreview(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => handleDelete(property.id, property.title)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PropertyView
        property={property}
        schemas={schemas}
        open={openPreview}
        setOpen={setOpenPreview}
      />
    </div>
  );
}
