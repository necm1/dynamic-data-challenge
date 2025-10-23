'use client';

import { useState } from 'react';
import { EntityType } from '@repo/shared';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { MetadataContainer } from './container';
import type { MetadataSchema } from '@repo/web-utils/actions/metadata';
import { PaginatedResponse } from '@repo/web-utils/types/paginated-response';

interface MetadataViewProps {
  initialData: Record<EntityType, PaginatedResponse<MetadataSchema>>;
}

export function MetadataView({ initialData }: MetadataViewProps) {
  const [activeTab, setActiveTab] = useState<string>(
    String(EntityType.Property),
  );

  return (
    <Tabs
      defaultValue={String(EntityType.Property)}
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value={String(EntityType.Property)}>
          Properties
        </TabsTrigger>
        <TabsTrigger value={String(EntityType.Listing)}>Listings</TabsTrigger>
        <TabsTrigger value={String(EntityType.Client)}>Clients</TabsTrigger>
      </TabsList>

      <TabsContent value={String(EntityType.Property)} className="mt-6">
        <MetadataContainer
          initialData={initialData[EntityType.Property]}
          entityType={EntityType.Property}
        />
      </TabsContent>

      <TabsContent value={String(EntityType.Listing)} className="mt-6">
        <MetadataContainer
          initialData={initialData[EntityType.Listing]}
          entityType={EntityType.Listing}
        />
      </TabsContent>

      <TabsContent value={String(EntityType.Client)} className="mt-6">
        <MetadataContainer
          initialData={initialData[EntityType.Client]}
          entityType={EntityType.Client}
        />
      </TabsContent>
    </Tabs>
  );
}
