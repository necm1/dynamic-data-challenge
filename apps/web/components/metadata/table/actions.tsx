'use client';

import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteMetadataSchema,
  type MetadataSchema,
} from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { toast } from 'sonner';

interface FieldSchemaActionsProps {
  schema: MetadataSchema;
  entityType: EntityType;
  onEdit: (schema: MetadataSchema) => void;
}

export function FieldSchemaActions({
  schema,
  entityType,
  onEdit,
}: FieldSchemaActionsProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteMetadataSchema,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['metadata-schemas', entityType],
      });
      toast.success('Field schema deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete field schema');
    },
  });

  const handleDelete = () => {
    if (
      confirm(
        `Delete field "${schema.field_label}"? This cannot be undone and will remove the field from all ${entityType === EntityType.Property ? 'properties' : entityType === EntityType.Listing ? 'listings' : 'clients'}.`,
      )
    ) {
      deleteMutation.mutate(schema.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(schema)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
