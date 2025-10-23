import Link from 'next/link';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft } from 'lucide-react';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import { PropertyForm } from '../../../components/properties/form';

export const dynamic = 'force-dynamic';

export default async function CreatePropertyPage() {
  const schemasResponse = await getMetadataSchemas(EntityType.Property);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/properties">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Property</h1>
          <p className="text-muted-foreground">
            Add a new property with custom fields
          </p>
        </div>
      </div>

      <PropertyForm schemas={schemasResponse.data} />
    </div>
  );
}
