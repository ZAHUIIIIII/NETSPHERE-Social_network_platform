// import React from 'react';

// export const Button = ({ 
//   children, 
//   onClick, 
//   type = 'button',
//   variant = 'primary',
//   disabled = false,
//   className = '',
//   ...props 
// }) => {
//   const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  
//   const variants = {
//     primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
//     outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
//     danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
//   };

//   const variantStyle = variants[variant] || variants.primary;
//   const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

//   return (
//     <button
//       type={type}
//       onClick={onClick}
//       disabled={disabled}
//       className={`${baseStyles} ${variantStyle} ${disabledStyle} ${className}`}
//       {...props}
//     >
//       {children}
//     </button>
//   );
// };

// export default Button;