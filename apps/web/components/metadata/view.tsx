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

const transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.15,
};

const getHoverAnimationProps = (hoveredRect: DOMRect, navRect: DOMRect) => ({
  x: hoveredRect.left - navRect.left - 10,
  y: hoveredRect.top - navRect.top - 4,
  width: hoveredRect.width + 20,
  height: hoveredRect.height + 10,
});

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

// <Tabs
//   value={activeTab.toString()}
//   onValueChange={(value) => setActiveTab(Number(value) as EntityType)}
//   className="w-full"
// >
//   <TabsList>
//     <TabsTrigger value={EntityType.Property.toString()}>
//       Properties
//     </TabsTrigger>
//     <TabsTrigger value={EntityType.Listing.toString()}>
//       Listings
//     </TabsTrigger>
//     <TabsTrigger value={EntityType.Client.toString()}>Clients</TabsTrigger>
//   </TabsList>

//   <TabsContent value={EntityType.Property.toString()} className="mt-6">
//     <MetadataContainer
//       initialData={initialData[EntityType.Property]}
//       entityType={EntityType.Property}
//     />
//   </TabsContent>

//   <TabsContent value={EntityType.Listing.toString()} className="mt-6">
//     <MetadataContainer
//       initialData={initialData[EntityType.Listing]}
//       entityType={EntityType.Listing}
//     />
//   </TabsContent>

//   <TabsContent value={EntityType.Client.toString()} className="mt-6">
//     <MetadataContainer
//       initialData={initialData[EntityType.Client]}
//       entityType={EntityType.Client}
//     />
//   </TabsContent>
// </Tabs>
