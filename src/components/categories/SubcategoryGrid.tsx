import { useNavigate } from "react-router-dom";
import { Category } from "@/hooks/useCategories";

interface SubcategoryGridProps {
  subcategories: Category[];
  parentCategory: Category | null;
}

const SubcategoryGrid = ({ subcategories, parentCategory }: SubcategoryGridProps) => {
  const navigate = useNavigate();

  // If no subcategories, show placeholder items
  const displayItems = subcategories.length > 0 
    ? subcategories 
    : [
        { id: "1", name: "Women Blazers", slug: "women-blazers", icon: null },
        { id: "2", name: "Women Suit Sets", slug: "women-suit-sets", icon: null },
        { id: "3", name: "Women Blouses", slug: "women-blouses", icon: null },
        { id: "4", name: "Women Short Dresses", slug: "women-short-dresses", icon: null },
        { id: "5", name: "Women Mini Dresses", slug: "women-mini-dresses", icon: null },
        { id: "6", name: "Women Lightweight Blazers", slug: "women-lightweight-blazers", icon: null },
        { id: "7", name: "Women Skirts", slug: "women-skirts", icon: null },
        { id: "8", name: "Kurtis & Tunics", slug: "kurtis-tunics", icon: null },
        { id: "9", name: "Women Maxi Dresses", slug: "women-maxi-dresses", icon: null },
      ] as any[];

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Section title */}
      <div className="px-4 py-3 sticky top-0 bg-white z-10">
        <h2 className="text-base font-semibold text-gray-900">
          Picks for You
        </h2>
      </div>

      {/* Subcategories grid */}
      <div className="px-2 pb-20">
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
          {displayItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/categoria/${item.slug}`)}
              className="flex flex-col items-center text-center group"
            >
              {/* Circular image container */}
              <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-gray-100 mb-2 border border-gray-200 group-hover:border-red-400 transition-colors">
                {item.icon ? (
                  <img 
                    src={item.icon} 
                    alt={item.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 via-gray-100 to-blue-100 flex items-center justify-center">
                    <span className="text-xl text-gray-400 font-medium">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {/* Name */}
              <span className="text-[11px] text-gray-700 leading-tight line-clamp-2 px-1">
                {item.name}
              </span>
            </button>
          ))}
        </div>

        {/* "You May Also Like" section */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4 px-2">
            You May Also Like
          </h3>
          <div className="grid grid-cols-3 gap-x-2 gap-y-4">
            {[
              { id: "also-1", name: "Ethnic Dresses", slug: "ethnic-dresses" },
              { id: "also-2", name: "Tangzhuang", slug: "tangzhuang" },
              { id: "also-3", name: "Women Trench Coats", slug: "women-trench-coats" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/categoria/${item.slug}`)}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-gray-100 mb-2 border border-gray-200 group-hover:border-red-400 transition-colors">
                  <div className="w-full h-full bg-gradient-to-br from-amber-100 via-gray-100 to-rose-100 flex items-center justify-center">
                    <span className="text-xl text-gray-400 font-medium">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-gray-700 leading-tight line-clamp-2 px-1">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubcategoryGrid;
