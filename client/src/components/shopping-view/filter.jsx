import { filterOptions } from "@/config";
import { Fragment } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { SlidersHorizontal } from "lucide-react";
import PropTypes from "prop-types";

function ProductFilter({ filters, handleFilter }) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-5 border-b flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-wider">Filters</h2>
      </div>
      <div className="p-5 space-y-5">
        {Object.keys(filterOptions).map((keyItem) => (
          <Fragment key={keyItem}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {keyItem}
              </h3>
              <div className="grid gap-2.5">
                {filterOptions[keyItem].map((option) => (
                  <Label
                    key={option.id}
                    className="flex items-center gap-2.5 text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                  >
                    <Checkbox
                      checked={
                        filters &&
                        Object.keys(filters).length > 0 &&
                        filters[keyItem] &&
                        filters[keyItem].indexOf(option.id) > -1
                      }
                      onCheckedChange={() => handleFilter(keyItem, option.id)}
                      className="rounded"
                    />
                    {option.label}
                  </Label>
                ))}
              </div>
            </div>
            <Separator className="last:hidden" />
          </Fragment>
        ))}
      </div>
    </div>
  );
}

ProductFilter.propTypes = {
  filters: PropTypes.object,
  handleFilter: PropTypes.func,
};

export default ProductFilter;
