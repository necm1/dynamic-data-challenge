import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Building2,
  Users,
  FileText,
  Database,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { getProperties } from '@repo/web-utils/actions/properties';
import { getClients } from '@repo/web-utils/actions/clients';
import { getListings } from '@repo/web-utils/actions/listings';
import { getMetadataSchemas } from '@repo/web-utils/actions/metadata';
import { EntityType } from '@repo/shared';
import Link from 'next/link';
import { Button } from '@repo/ui/components/button';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Dashboard - Real Estate Management',
  description:
    'Overview of properties, clients, and listings in the Real Estate Management System',
};

export default async function HomePage() {
  const [
    propertiesData,
    clientsData,
    listingsData,
    propertySchemas,
    clientSchemas,
    listingSchemas,
  ] = await Promise.all([
    getProperties({ params: [], page: 1, perPage: 1 }),
    getClients({ page: 1, perPage: 1 }),
    getListings({ page: 1, perPage: 1 }),
    getMetadataSchemas(EntityType.Property),
    getMetadataSchemas(EntityType.Client),
    getMetadataSchemas(EntityType.Listing),
  ]);

  const totalCustomFields =
    propertySchemas.data.length +
    clientSchemas.data.length +
    listingSchemas.data.length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real Estate Agency Management System
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {propertiesData.meta.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {propertySchemas.data.length} custom fields
            </p>
            <Link href="/properties">
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs cursor-pointer"
              >
                View all
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientsData.meta.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {clientSchemas.data.length} custom fields
            </p>
            <Link href="/clients">
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs cursor-pointer"
              >
                View all
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Listings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listingsData.meta.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {listingSchemas.data.length} custom fields
            </p>
            <Link href="/listings">
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs cursor-pointer"
              >
                View all
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Custom Fields
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomFields}</div>
            <p className="text-xs text-muted-foreground">Across all entities</p>
            <Link href="/metadata">
              <Button
                variant="link"
                className="h-auto p-0 mt-2 text-xs cursor-pointer"
              >
                Manage schemas
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
