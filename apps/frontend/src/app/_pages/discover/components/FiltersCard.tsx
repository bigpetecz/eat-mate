import { Card } from '@/components/ui/card';
import { RecipeFilters } from '../RecipeFilters';

interface FiltersCardProps {
  defaultValues: any;
  dict: Record<string, string>;
  onReset: () => void;
  onSearchSubmit: (values: Record<string, unknown>) => void;
  onFiltersSubmit: (values: Record<string, unknown>) => void;
}

export const FiltersCard = ({
  defaultValues,
  dict,
  onReset,
  onSearchSubmit,
  onFiltersSubmit,
}: FiltersCardProps) => (
  <div className="py-8 max-w-5xl mx-auto px-2 md:px-0">
    <Card className="p-4 md:p-8 bg-background">
      <RecipeFilters
        dict={dict}
        defaultValues={defaultValues}
        onReset={onReset}
        onSearchSubmit={onSearchSubmit}
        onFiltersSubmit={onFiltersSubmit}
      />
    </Card>
  </div>
);
