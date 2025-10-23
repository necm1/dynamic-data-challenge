import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { getPropertyById } from '@repo/web-utils/actions/properties';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { PropertyForm } from '../../../../components/properties/form';

export const dynamic = 'force-dynamic';

type PageParams = Promise<{ id: string }>;

export default async function EditPropertyPage({
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
          <Link href={`/properties/${id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Property</h1>
            <p className="text-muted-foreground">Update property information</p>
          </div>
        </div>

        <PropertyForm property={property.data} schemas={schemasResponse.data} />
      </div>
    );
  } catch (error) {
    console.error('Failed to load property:', error);
    notFound();
  }
}
