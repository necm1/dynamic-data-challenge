import { Suspense } from 'react';
import { ListingTable } from '../../components/listings/table/table';
import { ListingFilters } from '../../components/listings/table/filters';
import { getListings } from '@repo/web-utils/actions/listings';
import { SearchParams } from 'next/dist/server/request/search-params';
import { Metadata } from 'next';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { ListingView } from '../../components/listings/view';
import { Button } from '@repo/ui/components/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Listings',
  description: 'Manage your property listings',
};

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 20;

  const filters = {
    status: params.status ? Number(params.status) : undefined,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    property_id: params.property_id as string,
    customFields: params.customFields
      ? JSON.parse(params.customFields as string)
      : undefined,
  };

  const [initialData, schemasResponse] = await Promise.all([
    await getListings({
      page,
      perPage,
      ...filters,
    }),
    getMetadataSchemas(EntityType.Listing),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Listings</h1>
          <p className="text-muted-foreground">
            Manage your property listings with custom fields
          </p>
        </div>
        <ListingView
          schemas={schemasResponse.data}
          trigger={<Button>Create Listing</Button>}
        />
      </div>

      <ListingFilters schemas={schemasResponse.data} />

      <Suspense fallback={<div>Loading listings...</div>}>
        <ListingTable
          initialData={initialData}
          schemas={schemasResponse.data}
        />
      </Suspense>
    </div>
  );
}
