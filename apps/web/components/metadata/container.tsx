'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { EntityType } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Plus } from 'lucide-react';
import { FieldSchemaTable } from './table/table';
import { FieldSchemaDrawer } from './drawer';
import { MetadataFilterBar } from './table/filter-bar';
import {
  getMetadataSchemas,
  getMetadataSchemasPaginated,
  type MetadataSchema,
} from '@repo/web-utils/actions/metadata';
import type { PaginatedResponse } from '@repo/web-utils/types/paginated-response';

interface MetadataContainerProps {
  initialData: PaginatedResponse<MetadataSchema>;
  entityType: EntityType;
}

export function MetadataContainer({
  initialData,
  entityType,
}: MetadataContainerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<MetadataSchema | null>(
    null,
  );

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Parse URL params
  const page = Number(searchParams.get('page')) || 1;
  const perPage = Number(searchParams.get('perPage')) || 20;
  const field_key = searchParams.get('field_key') || '';
  const field_label = searchParams.get('field_label') || '';
  const field_type = searchParams.get('field_type') || '';

  const filterParams = useMemo(
    () => ({
      entity_type: entityType,
      page,
      perPage,
      field_key,
      field_label,
      field_type,
    }),
    [entityType, page, perPage, field_key, field_label, field_type],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['metadata-schemas', filterParams],
    queryFn: () => getMetadataSchemasPaginated(filterParams),
    initialData,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const schemas = data?.data || [];
  const meta = data?.meta;

  const handleCreate = () => {
    setSelectedSchema(null);
    setDrawerOpen(true);
  };

  const handleEdit = (schema: MetadataSchema) => {
    setSelectedSchema(schema);
    setDrawerOpen(true);
  };

  const handleSuccess = () => {
    setDrawerOpen(false);
    setSelectedSchema(null);
    queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] });
  };

  const entityLabels = {
    [EntityType.Property]: 'Properties',
    [EntityType.Listing]: 'Listings',
    [EntityType.Client]: 'Clients',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.total || 0} custom field{(meta?.total || 0) !== 1 ? 's' : ''}{' '}
          defined
        </p>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Field for {entityLabels[entityType]}
        </Button>
      </div>

      <MetadataFilterBar />

      <FieldSchemaTable
        schemas={schemas}
        entityType={entityType}
        onEdit={handleEdit}
        meta={meta}
        isLoading={isLoading}
        isFetching={isFetching}
      />

      <FieldSchemaDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        entityType={entityType}
        schema={selectedSchema}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
