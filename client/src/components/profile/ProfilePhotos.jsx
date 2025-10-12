// import React, { useState } from 'react';
// import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// const ProfilePhotos = ({ posts }) => {
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // Extract all images from posts
//   const allImages = posts
//     .filter(post => post.images && post.images.length > 0)
//     .flatMap(post => post.images.map(img => ({
//       url: img,
//       postId: post._id,
//       caption: post.content
//     })));

//   const openLightbox = (index) => {
//     setSelectedImage(allImages[index]);
//     setCurrentIndex(index);
//   };

//   const closeLightbox = () => {
//     setSelectedImage(null);
//   };

//   const goToPrevious = () => {
//     const newIndex = (currentIndex - 1 + allImages.length) % allImages.length;
//     setCurrentIndex(newIndex);
//     setSelectedImage(allImages[newIndex]);
//   };

//   const goToNext = () => {
//     const newIndex = (currentIndex + 1) % allImages.length;
//     setCurrentIndex(newIndex);
//     setSelectedImage(allImages[newIndex]);
//   };

//   if (allImages.length === 0) {
//     return (
//       <div className="text-center py-16 bg-white rounded-2xl shadow-sm mt-4">
//         <div className="text-6xl mb-4">📷</div>
//         <h3 className="text-xl font-bold text-gray-900 mb-2">No photos yet</h3>
//         <p className="text-gray-600">Photos from posts will appear here</p>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="grid grid-cols-3 gap-1 mt-4">
//         {allImages.map((image, index) => (
//           <div
//             key={`${image.postId}-${index}`}
//             className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
//             onClick={() => openLightbox(index)}
//           >
//             <img
//               src={image.url}
//               alt=""
//               className="w-full h-full object-cover transition-transform group-hover:scale-110"
//             />
//             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
//           </div>
//         ))}
//       </div>

//       {/* Lightbox */}
//       {selectedImage && (
//         <div 
//           className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
//           onClick={closeLightbox}
//         >
//           <button
//             onClick={closeLightbox}
//             className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
//           >
//             <X size={24} />
//           </button>

//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               goToPrevious();
//             }}
//             className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
//           >
//             <ChevronLeft size={28} />
//           </button>

//           <button
//             onClick={(e) => {
//               e.stopPropagation();
//               goToNext();
//             }}
//             className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
//           >
//             <ChevronRight size={28} />
//           </button>

//           <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
//             <img
//               src={selectedImage.url}
//               alt=""
//               className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
//             />
//             {selectedImage.caption && (
//               <p className="text-white mt-4 text-center">{selectedImage.caption}</p>
//             )}
//             <p className="text-white/60 text-sm text-center mt-2">
//               {currentIndex + 1} / {allImages.length}
//             </p>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default ProfilePhotos;