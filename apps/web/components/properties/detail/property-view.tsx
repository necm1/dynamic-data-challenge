'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { Badge } from '@repo/ui/components/badge';
import { Separator } from '@repo/ui/components/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/alert-dialog';
import { deleteProperty } from '@repo/web-utils/actions/properties';
import type { MetadataSchema } from '@repo/web-utils/actions/metadata';
import {
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Loader2,
  Check,
  X,
} from 'lucide-react';

type Property = {
  id: string;
  title: string;
  address: string;
  price: number;
  year_built: number;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
};

type PropertyDetailViewProps = {
  property: Property;
  schemas: MetadataSchema[];
};

export function PropertyDetailView({
  property,
  schemas,
}: PropertyDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteProperty(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      router.push('/properties');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const renderCustomFieldValue = (schema: MetadataSchema, value: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    switch (schema.field_type) {
      case 'BOOLEAN':
        return (
          <Badge variant={value ? 'default' : 'secondary'} className="gap-1">
            {value ? (
              <>
                <Check className="h-3 w-3" /> Yes
              </>
            ) : (
              <>
                <X className="h-3 w-3" /> No
              </>
            )}
          </Badge>
        );

      case 'NUMBER':
        return (
          <span className="font-medium">{Number(value).toLocaleString()}</span>
        );

      case 'DATE':
        return (
          <span className="font-medium">
            {new Date(value).toLocaleDateString()}
          </span>
        );

      case 'SELECT':
        console.log('value type', value);
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, idx) => (
                <Badge key={idx} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
        return <Badge variant="outline">{value}</Badge>;

      case 'TEXT':
        return <p className="text-sm whitespace-pre-wrap">{value}</p>;

      case 'STRING':
      default:
        return <span className="font-medium">{String(value)}</span>;
    }
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Property Information</CardTitle>
            <div className="flex gap-2">
              <Link href={`/properties/${property.id}/edit`}>
                <Button size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <h2 className="text-2xl font-bold">{property.title}</h2>
            </div>

            <Separator />

            {/* Core Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </div>
                <p className="font-medium">{property.address}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Price</span>
                </div>
                <p className="text-2xl font-bold">
                  ${(property.price || 0).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Year Built</span>
                </div>
                <p className="font-medium">{property.year_built}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm">
                  {new Date(property.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields Card */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
          </CardHeader>
          <CardContent>
            {schemas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom fields defined
              </p>
            ) : (
              <div className="space-y-4">
                {schemas
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((schema) => {
                    const value = property.custom_fields?.[schema.field_key];
                    return (
                      <div key={schema.id} className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {schema.field_label}
                        </p>
                        <div>{renderCustomFieldValue(schema, value)}</div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{property.title}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
