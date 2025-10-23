import { Suspense } from 'react';
import { ClientTable } from '../../components/client/table/table';
import { ClientFilters } from '../../components/client/table/filters';
import { getClients } from '@repo/web-utils/actions/clients';
import { SearchParams } from 'next/dist/server/request/search-params';
import { Metadata } from 'next';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { ClientView } from '../../components/client/view';
import { Button } from '@repo/ui/components/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Clients',
  description: 'Manage your client database',
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 20;

  const filters = {
    name: params.name as string,
    email: params.email as string,
    customFields: params.customFields
      ? JSON.parse(params.customFields as string)
      : undefined,
  };

  const [initialData, schemasResponse] = await Promise.all([
    await getClients({
      page,
      perPage,
      ...filters,
    }),
    getMetadataSchemas(EntityType.Client),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client database with custom fields
          </p>
        </div>
        <ClientView
          schemas={schemasResponse.data}
          trigger={
            <Button>
              {/* <Plus className="mr-2 h-4 w-4" /> */}
              Create Client
            </Button>
          }
        />
      </div>

      <ClientFilters schemas={schemasResponse.data} />

      <Suspense fallback={<div>Loading clients...</div>}>
        <ClientTable initialData={initialData} schemas={schemasResponse.data} />
      </Suspense>
    </div>
  );
}
