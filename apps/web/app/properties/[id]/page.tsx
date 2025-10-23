import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPropertyById } from '@repo/web-utils/actions/properties';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { PropertyDetailView } from '../../../components/properties/detail/property-view';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageParams = Promise<{ id: string }>;

export default async function PropertyDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const { id } = await params;

  try {
    const [property, schemasResponse] = await Promise.all([
      getPropertyById(id),
      getMetadataSchemas(EntityType.Property),
    ]);

    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/properties">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Property Details
            </h1>
            <p className="text-muted-foreground">View property information</p>
          </div>
        </div>

        <PropertyDetailView
          property={property.data}
          schemas={schemasResponse.data}
        />
      </div>
    );
  } catch (error) {
    console.error('Failed to load property:', error);
    notFound();
  }
}
