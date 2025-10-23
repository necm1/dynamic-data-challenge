import { Suspense } from 'react';
import { getMetadataSchemasPaginated } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { MetadataView } from '../../components/metadata/view';
import { Metadata } from 'next';
import { SearchParams } from 'next/dist/server/request/search-params';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Field Schema Management',
  description: 'Define custom fields for Properties, Listings, and Clients',
};

export default async function MetadataPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 20;
  const field_key = (params.field_key as string) || '';
  const field_label = (params.field_label as string) || '';
  const field_type = (params.field_type as string) || '';

  const [propertySchemas, listingSchemas, clientSchemas] = await Promise.all([
    getMetadataSchemasPaginated({
      entity_type: EntityType.Property,
      page,
      perPage,
      field_key,
      field_label,
      field_type,
    }),
    getMetadataSchemasPaginated({
      entity_type: EntityType.Listing,
      page,
      perPage,
      field_key,
      field_label,
      field_type,
    }),
    getMetadataSchemasPaginated({
      entity_type: EntityType.Client,
      page,
      perPage,
      field_key,
      field_label,
      field_type,
    }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Field Schema Management
          </h1>
          <p className="text-muted-foreground">
            Define custom fields for Properties, Listings, and Clients
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Loading schemas...</div>}>
        <MetadataView
          initialData={{
            [EntityType.Property]: propertySchemas,
            [EntityType.Listing]: listingSchemas,
            [EntityType.Client]: clientSchemas,
          }}
        />
      </Suspense>
    </div>
  );
}
