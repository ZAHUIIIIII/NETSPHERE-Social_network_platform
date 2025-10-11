import { Users } from "lucide-react";

const SidebarSkeleton = () => {
  // Create 8 skeleton items
  const skeletonContacts = Array(8).fill(null);

  return (
    <aside className="h-full w-20 lg:w-80 border-r border-gray-200/50 flex flex-col transition-all duration-200 bg-white/50 backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-gray-200/50 w-full p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Users className="size-5 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-800 hidden lg:block">Messages</span>
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="overflow-y-auto w-full py-2 flex-1">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 lg:p-4 flex items-center gap-3 lg:gap-4">
            {/* Avatar skeleton */}
            <div className="relative mx-auto lg:mx-0 flex-shrink-0">
              <div className="skeleton size-12 lg:size-14 rounded-full" />
            </div>

            {/* User info skeleton - only visible on larger screens */}
            <div className="hidden lg:block text-left min-w-0 flex-1">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SidebarSkeleton;