import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@repo/ui/components/button';
import { Plus } from 'lucide-react';
import { PropertiesTable } from '../../components/properties/properties-table';
import { getProperties } from '@repo/web-utils/actions/properties';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function PropertiesDataWrapper({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 20;

  const filters = {
    title: params.title as string,
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    customFields: params.customFields
      ? JSON.parse(params.customFields as string)
      : undefined,
  };

  const [initialData, schemasResponse] = await Promise.all([
    getProperties({
      params: [filters],
      page,
      perPage,
    }),
    getMetadataSchemas(EntityType.Property),
  ]);

  return (
    <PropertiesTable initialData={initialData} schemas={schemasResponse.data} />
  );
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Link href="/properties/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Property
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div>Loading properties...</div>}>
        <PropertiesDataWrapper searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
