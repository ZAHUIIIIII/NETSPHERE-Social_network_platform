// import React, { useState, useEffect } from 'react';
// import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Send, Edit2, Trash2, Reply, X, Image as ImageIcon, RefreshCw } from 'lucide-react';
// import { Button } from '../ui/button';
// import LikesModal from './LikesModal';
// import { 
//   likePost, 
//   unlikePost, 
//   toggleLikePost, 
//   sharePost, 
//   unsharePost, 
//   getComments, 
//   addComment, 
//   toggleLikeComment, 
//   editComment, 
//   deleteComment, 
//   replyToComment,
//   editPost,
//   deletePost,
//   uploadPostImages
// } from '../../services/api';
// import { useUser } from '../../UserContext';
// import { formatHashtags } from '../../utils/textFormatting';

// const PostCard = ({ post, onPostUpdate, onPostDelete }) => {
//   // UI state for like, save, share
//   const [liked, setLiked] = useState(false);
//   const [saved, setSaved] = useState(false);
//   const [shared, setShared] = useState(false);
//   const [showComments, setShowComments] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [likesModalOpen, setLikesModalOpen] = useState(false);

//   // Define loading state
//   const [loading, setLoading] = useState(false);

//   const currentTime = new Date(); // Define currentTime at the top of the component

//   // Define likesCount, commentsCount, and sharesCount with default values
//   const likesCount = post.likes?.length || 0;
//   const commentsCount = post.comments?.length || 0;
//   const sharesCount = post.shares?.length || 0;

//   // Helper: relative time
//   const getRelativeTime = (date) => {
//     const now = new Date();
//     const d = new Date(date);
//     const diff = Math.floor((now - d) / 1000);
//     if (diff < 60) return `${diff}s ago`;
//     const min = Math.floor(diff / 60);
//     if (min < 60) return `${min}m ago`;
//     const hr = Math.floor(min / 60);
//     if (hr < 24) return `${hr}h ago`;
//     const day = Math.floor(hr / 24);
//     if (day < 7) return `${day}d ago`;
//     const wk = Math.floor(day / 7);
//     if (wk < 4) return `${wk}w ago`;
//     const mo = Math.floor(day / 30);
//     if (mo < 12) return `${mo}mo ago`;
//     const yr = Math.floor(day / 365);
//     return `${yr}y ago`;
//   };

//   // Privacy label
//   const getPrivacyLabel = (privacy) => {
//     const map = { public: '🌐 Public', friends: '👥 Friends', private: '🔒 Private' };
//     return map[privacy] || '🌐 Public';
//   };

//   // Avatar fallback + display name
//   const avatarUrl = post.user?.avatar || post.author?.avatar;
//   const userName = post.user?.name || post.user?.username || post.author?.username || post.author?.name || 'Anonymous';
//   const userInitial = (userName || 'U')[0].toUpperCase();
//   const isVerified = post.user?.isVerified || post.author?.isVerified;
//   const location = post.location || post.author?.location; // optional location field

//   // Images
//   const images = post.images || [];

//   // Helper: format hashtags
//   const formatHashtags = (content) => {
//     if (!content) return '';
//     return content.replace(/#(\w+)/g, '<span class="text-blue-500">#$1</span>');
//   };

//   // Define handleLike function to toggle the liked state
//   const handleLike = () => {
//     setLiked((prevLiked) => !prevLiked);
//   };

//   // Define handleToggleComments function to toggle comments visibility
//   const handleToggleComments = async () => {
//     setShowComments(!showComments);
    
//     // Load comments if opening for the first time and not already loaded
//     if (!showComments && comments.length === 0) {
//       console.log('Loading comments for post:', post._id);
//       try {
//         const response = await getComments(post._id);
//         console.log('Comments loaded:', response);
//         setComments(response || []);
//         // Don't update count here since it's handled by the useEffect
//       } catch (error) {
//         console.error('Error loading comments:', error);
//         if (error.response?.data?.message) {
//           console.error('API Error:', error.response.data.message);
//         }
//       }
//     }
//   };

//   // Define handleShare function to log share action
//   const handleShare = () => {
//     console.log('Share functionality not implemented yet.');
//   };

//   // Effect to sync liked state with post.likes
//   useEffect(() => {
//     const isPostLiked = post.likes?.some(like => like.userId === userId);
//     setLiked(isPostLiked);
//   }, [post.likes, userId]);

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//       {/* Post Header */}
//       <div className="p-4 flex items-start justify-between">
//         <div className="flex items-start gap-3">
//           {/* Avatar with ring */}
//           <div className="relative">
//             <div className="h-12 w-12 rounded-full p-[2px] bg-gradient-to-br from-blue-500 to-purple-500">
//               <div className="h-full w-full rounded-full bg-white overflow-hidden flex items-center justify-center">
//                 {avatarUrl ? (
//                   <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
//                 ) : (
//                   <span className="text-gray-700 font-bold text-lg">{userInitial}</span>
//                 )}
//               </div>
//             </div>
//             {isVerified && (
//               <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
//                 <div className="bg-blue-600 text-white rounded-full p-1">
//                   <Check className="h-3 w-3" />
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="min-w-0">
//             <div className="flex items-center gap-2">
//               <h3 className="font-semibold text-gray-900 truncate">{userName}</h3>
//               <div className="text-xs text-gray-500">{getRelativeTime(post.createdAt || new Date(), currentTime)}</div>
//               {location && <div className="text-xs text-gray-400">• {location}</div>}
//             </div>
//             <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatHashtags(post.content) }} />

//             {/* Hashtag chips (first few) */}
//             {post.tags && post.tags.length > 0 && (
//               <div className="flex gap-2 mt-3 flex-wrap">
//                 {post.tags.slice(0, 5).map((tag) => (
//                   <span key={tag} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">#{tag}</span>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100" aria-label="Post options">
//             <MoreHorizontal className="h-4 w-4" />
//           </Button>
//         </div>
//       </div>

//       {/* Post Content */}
//       <div className="px-4 pb-3">
//         <p className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
//       </div>

//       {/* Post Images - two-column layout: large left, tall right when 2 images */}
//       {images.length > 0 && (
//         <div className="px-4 pt-3">
//           {images.length === 1 && (
//             <div className="rounded-lg overflow-hidden">
//               <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt="post" className="w-full h-[420px] object-cover rounded-lg" />
//             </div>
//           )}

//           {images.length === 2 && (
//             <div className="grid grid-cols-2 gap-2">
//               <div className="rounded-lg overflow-hidden">
//                 <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt="left" className="w-full h-[420px] object-cover rounded-lg" />
//               </div>
//               <div className="rounded-lg overflow-hidden">
//                 <img src={typeof images[1] === 'string' ? images[1] : images[1].url} alt="right" className="w-full h-[420px] object-cover rounded-lg" />
//               </div>
//             </div>
//           )}

//           {images.length > 2 && (
//             <div className="grid grid-cols-2 gap-2">
//               <div className="rounded-lg overflow-hidden">
//                 <img src={typeof images[0] === 'string' ? images[0] : images[0].url} alt="large" className="w-full h-[420px] object-cover rounded-lg" />
//               </div>
//               <div className="grid gap-2">
//                 {images.slice(1, 4).map((img, i) => (
//                   <div key={i} className="rounded-lg overflow-hidden">
//                     <img src={typeof img === 'string' ? img : img.url} alt={`thumb-${i}`} className={`w-full ${i === 0 ? 'h-[206px]' : 'h-[104px]'} object-cover rounded-lg`} />
//                   </div>
//                 ))}
//                 {images.length > 4 && (
//                   <div className="absolute inset-0 flex items-center justify-center">
//                     <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Reactions row */}
//       <div className="px-4 pt-3 pb-2">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="flex items-center gap-1">
//               <span className="text-2xl">👍</span>
//               <span className="text-2xl">❤️</span>
//               <span className="text-2xl">😊</span>
//             </div>
//             <div className="text-sm text-gray-600">{likesCount} reactions</div>
//           </div>
//           <div className="flex items-center gap-6 text-sm text-gray-500">
//             <div>{commentsCount} comments</div>
//             <div>{sharesCount} shares</div>
//           </div>
//         </div>
//       </div>

//       {/* Action buttons - pill style */}
//       <div className="px-4 pb-4 pt-2 border-t border-gray-100/50">
//         <div className="flex items-center gap-4">
//           <Button
//             className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-sm ${liked ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//             onClick={handleLike}
//             disabled={loading}
//           >
//             <Heart className={`h-4 w-4 ${liked ? 'text-red-500' : 'text-gray-500'}`} />
//             <span className="font-medium">Like</span>
//           </Button>

//           <Button
//             className="flex items-center gap-3 px-5 py-3 rounded-full shadow-sm bg-white text-gray-700 hover:bg-gray-50"
//             onClick={handleToggleComments}
//           >
//             <MessageCircle className="h-4 w-4 text-gray-600" />
//             <span className="font-medium">Comment</span>
//           </Button>

//           <Button
//             className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-sm ${shared ? 'bg-green-50 text-green-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//             onClick={handleShare}
//             disabled={loading}
//           >
//             <Share className="h-4 w-4 text-gray-600" />
//             <span className="font-medium">Share</span>
//           </Button>

//           <div className="ml-auto">
//             <Button
//               className={`px-4 py-3 rounded-full shadow-sm ${saved ? 'bg-yellow-50 text-yellow-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
//               onClick={() => setSaved(s => !s)}
//             >
//               <Bookmark className={`h-4 w-4 ${saved ? 'text-yellow-500' : 'text-gray-600'}`} />
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Likes modal */}
//       <LikesModal postId={post._id} likesCount={likesCount}>
//         <div className="flex items-center gap-1 cursor-pointer hover:text-gray-700 transition-colors">
//           <span className="text-red-500">❤️</span>
//           <span>{likesCount} reactions</span>
//         </div>
//       </LikesModal>
//     </div>
//   );
// };

// export default PostCard;