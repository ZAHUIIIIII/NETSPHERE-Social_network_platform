import { Check } from "lucide-react";

const AdminBadge = ({ className = "", showLabel = true, size = "sm" }) => {
  const sizeClasses = {
    xs: "text-xs gap-0.5",
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-lg gap-2",
  };

  const iconSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]} ${className}`}>
      {/* Verified Checkmark */}
      <span className="inline-flex items-center justify-center w-fit h-fit bg-gradient-to-br from-purple-500 to-pink-500 rounded-full p-0.5 shadow-md">
        <Check className="text-white" size={iconSizes[size]} strokeWidth={3} />
      </span>
      
      {/* Admin Label */}
      {showLabel && (
        <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full shadow-sm">
          Admin
        </span>
      )}
    </div>
  );
};

export default AdminBadge;
