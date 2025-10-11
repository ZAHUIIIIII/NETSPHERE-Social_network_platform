// import React, { useState } from 'react';
// import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
// import { Button } from '../ui/button';
// import { Heart, X } from 'lucide-react';
// import { getPostLikes } from '../../services/api';

// const LikesModal = ({ postId, likesCount, children }) => {
//   const [likes, setLikes] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [open, setOpen] = useState(false);

//   const loadLikes = async () => {
//     if (!postId || loading) return;

//     setLoading(true);
//     try {
//       const response = await getPostLikes(postId);
//       setLikes(response.likes || []);
//     } catch (error) {
//       console.error('Error loading likes:', error);
//       setLikes([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenChange = (newOpen) => {
//     setOpen(newOpen);
//     if (newOpen && likes.length === 0) {
//       loadLikes();
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={handleOpenChange}>
//       <DialogTrigger asChild>
//         {children}
//       </DialogTrigger>
//       <DialogContent className="max-w-md border-gray-200 rounded-lg shadow-lg" style={{ backgroundColor: '#ffffff' }}>
//         <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-t-lg">
//           <DialogTitle className="text-white text-lg font-semibold">
//             {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
//           </DialogTitle>
//           <button
//             onClick={() => setOpen(false)}
//             className="h-8 w-8 p-0 text-white hover:text-gray-200"
//             aria-label="Close"
//           >
//             <X className="h-4 w-4" />
//           </button>
//         </div>

//         <div className="max-h-96 overflow-y-auto px-4">
//           {loading ? (
//             <div className="flex items-center justify-center py-8">
//               <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-transparent"></div>
//             </div>
//           ) : likes.length === 0 ? (
//             <div className="text-center py-8">
//               <Heart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//               <p className="text-gray-500 text-sm">No reactions yet</p>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {likes.map((user) => (
//                 <div key={user._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
//                   <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
//                     <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
//                       {user.avatar ? (
//                         <img
//                           src={user.avatar}
//                           alt={user.username}
//                           className="h-full w-full rounded-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-gray-700 font-medium text-sm">
//                           {(user.username || user.profile?.name || 'U').charAt(0).toUpperCase()}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2">
//                       <p className="font-semibold text-gray-900 text-sm truncate">
//                         {user.username || user.profile?.name || 'Unknown User'}
//                       </p>
//                       {user.profile?.verified && (
//                         <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </div>
//                     {user.profile?.bio && (
//                       <p className="text-xs text-gray-500 truncate mt-0.5">
//                         {user.profile.bio}
//                       </p>
//                     )}
//                   </div>
//                   <div className="flex-shrink-0">
//                     <Heart className="h-5 w-5 text-red-500 fill-current" />
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {!loading && likes.length > 0 && (
//           <div className="mt-4 pt-3 border-t border-gray-200">
//             <p className="text-center text-xs text-gray-400">
//               {likesCount} {likesCount === 1 ? 'person likes' : 'people like'} this post
//             </p>
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default LikesModal;