import { cn } from "@/lib/utils";
import { Category } from "@/hooks/useCategories";

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

// Static subcategory items for sidebar (like in the reference image)
const staticItems = [
  "New In",
  "Trending", 
  "Sale",
  "Clothing",
  "Dresses",
  "Tops",
  "Bottoms",
  "Sweaters & Sweatshirts",
  "Outerwear",
  "Denim",
  "Jumpsuits & Co-ords",
  "Beachwear",
  "Maternity Clothing",
  "Weddings & Events",
  "Underwear & Sleepwear",
  "Sports & Outdoors",
];

const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory 
}: CategorySidebarProps) => {
  // Get root categories (no parent)
  const rootCategories = categories.filter((c) => !c.parent_id);

  // Use actual categories if available, otherwise use static items
  const displayItems = rootCategories.length > 0 
    ? rootCategories 
    : staticItems.map((name, i) => ({ id: `static-${i}`, name, slug: name.toLowerCase().replace(/\s+/g, '-') }));

  return (
    <aside className="w-[140px] flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto">
      {/* "Just for You" header */}
      <div className="px-2 py-3 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-4 bg-red-500 rounded-sm" />
          <span className="text-sm font-semibold text-gray-900">Just for You</span>
        </div>
      </div>

      {/* Category list */}
      <nav className="pb-4">
        {displayItems.map((item, index) => {
          const itemId = typeof item === 'string' ? `static-${index}` : item.id;
          const itemName = typeof item === 'string' ? item : item.name;
          const isSelected = selectedCategory === itemId;
          
          return (
            <button
              key={itemId}
              onClick={() => onSelectCategory(itemId)}
              className={cn(
                "w-full text-left px-3 py-2.5 text-[13px] leading-tight transition-colors",
                isSelected 
                  ? "text-gray-900 font-medium bg-gray-50" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {itemName}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default CategorySidebar;
