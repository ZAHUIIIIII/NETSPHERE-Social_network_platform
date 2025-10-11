const MessageSkeleton = () => {
  // Create an array of 6 items for skeleton messages
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gradient-to-b from-blue-50/20 via-white/40 to-purple-50/20">
      {skeletonMessages.map((_, idx) => (
        <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? "items-start" : "items-end"}`}>
          {/* Time skeleton */}
          <div className="skeleton h-3 w-16 mb-1" />
          
          {/* Message container */}
          <div className={`flex items-end gap-3 ${idx % 2 === 0 ? "justify-start" : "justify-end"}`}>
            {/* Avatar skeleton */}
            {idx % 2 === 0 && (
              <div className="flex-shrink-0 mb-1">
                <div className="w-8 h-8 rounded-full skeleton" />
              </div>
            )}

            {/* Message bubble skeleton */}
            <div className={`max-w-sm lg:max-w-md rounded-2xl p-4 ${
              idx % 2 === 0 ? "bg-white border border-gray-200/60" : "bg-gradient-to-br from-blue-500/80 to-blue-600/80"
            }`}>
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-4 w-24" />
            </div>

            {/* Avatar skeleton for sent messages */}
            {idx % 2 === 1 && (
              <div className="flex-shrink-0 mb-1">
                <div className="w-8 h-8 rounded-full skeleton" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;