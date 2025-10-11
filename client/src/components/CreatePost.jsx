// import React, { useState, useRef, useEffect } from 'react';
// import { ChevronLeft, Camera, MapPin, Hash, AtSign } from 'lucide-react';
// import { Button } from './ui/button';
// import { Textarea } from './ui/textarea';
// import { useAuthStore } from '../store/useAuthStore';
// import { useNavigate } from 'react-router-dom';

// const privacyOptions = [
//   { value: 'public', label: 'Public', icon: '🌐', description: 'Anyone can see' },
//   { value: 'friends', label: 'Friends', icon: '👥', description: 'Friends only' },
//   { value: 'private', label: 'Private', icon: '🔒', description: 'Just me' }
// ];

// const CreatePost = ({ onCancel, onSubmit }) => {
//   const { authUser } = useAuthStore();
//   const navigate = useNavigate();
//   const [content, setContent] = useState('');
//   const [images, setImages] = useState([]);
//   const [isPosting, setIsPosting] = useState(false);
//   const [postProgress, setPostProgress] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [privacy, setPrivacy] = useState('public');
//   const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
//   const [activeTab, setActiveTab] = useState('compose');
//   const fileInputRef = useRef(null);
//   const maxImages = 4;
//   const maxCharacters = 2000;

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showEmojiPicker || showPrivacyDropdown) {
//         if (!event.target.closest('.emoji-picker') && !event.target.closest('.privacy-dropdown')) {
//           setShowEmojiPicker(false);
//           setShowPrivacyDropdown(false);
//         }
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, [showEmojiPicker, showPrivacyDropdown]);

//   const handleImageUpload = (newImages) => {
//     setImages((prev) => {
//       const combined = [...prev, ...newImages];
//       return combined.slice(0, maxImages);
//     });
//   };

//   const removeImage = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

//   const handlePost = async () => {
//     const hasContent = content.trim().length > 0;
//     const hasImages = images.length > 0;
//     if (!hasContent && !hasImages) {
//       alert('Please add some content or images to your post.');
//       return;
//     }
//     setIsPosting(true);
//     setPostProgress(0);
//     try {
//       const postData = {
//         content: content.trim(),
//         images: images,
//         privacy,
//         userName: authUser?.name || 'User'
//       };
//       if (onSubmit) {
//         await onSubmit(postData);
//         setContent('');
//         setImages([]);
//         setPrivacy('public');
//         setShowEmojiPicker(false);
//         setShowPrivacyDropdown(false);
//         if (onCancel) {
//           onCancel();
//         }
//       }
//     } catch (error) {
//       console.error('Error creating post:', error);
//       alert('Failed to create post. Please try again.');
//     } finally {
//       setIsPosting(false);
//       setPostProgress(0);
//     }
//   };

//   const addEmoji = (emoji) => {
//     setContent(prev => prev + emoji);
//     setShowEmojiPicker(false);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <div className="max-w-2xl mx-auto bg-white shadow-sm text-gray-900">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4">
//           <div className="flex items-center gap-2">
//             <Button
//               variant="primary"
//               onClick={() => (onCancel ? onCancel() : navigate('/'))}
//               className="h-8 w-8 p-0 flex items-center justify-center rounded-lg"
//               aria-label="Back to home"
//             >
//               <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-transparent">
//                 <ChevronLeft className="h-4 w-4 text-white" />
//               </span>
//             </Button>
//             <h1 className="text-xl font-semibold">Create Post</h1>
//           </div>
//           <Button 
//             onClick={handlePost} 
//             disabled={isPosting || (!content.trim() && images.length === 0)} 
//             className="bg-blue-500 hover:bg-blue-600 text-white px-6"
//           >
//             {isPosting ? 'Posting...' : 'Post'}
//           </Button>
//         </div>

//         {/* Tabs */}
//         <div className="border-b border-gray-200">
//           <div className="flex">
//             <button
//               type="button"
//               onClick={() => setActiveTab('compose')}
//               aria-pressed={activeTab === 'compose'}
//               className={`flex-1 py-3 px-6 text-center text-sm font-medium transition-colors ${
//                 activeTab === 'compose' 
//                   ? 'border-b-2 border-blue-500 text-blue-500' 
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Compose
//             </button>
//             <button
//               type="button"
//               onClick={() => setActiveTab('preview')}
//               aria-pressed={activeTab === 'preview'}
//               className={`flex-1 py-3 px-6 text-center text-sm font-medium transition-colors ${
//                 activeTab === 'preview' 
//                   ? 'border-b-2 border-blue-500 text-blue-500' 
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               Preview
//             </button>
//           </div>
//         </div>

//         <div className="p-4 space-y-4">
//           {activeTab === 'compose' ? (
//             <React.Fragment>
//               {/* User and Privacy */}
//           <div className="flex items-center gap-3">
//             <div className="relative">
//               {authUser?.avatar ? (
//                 <img
//                   src={authUser.avatar}
//                   alt={authUser?.name || 'User'}
//                   className="h-10 w-10 rounded-full bg-gray-200 object-cover"
//                   onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
//                 />
//               ) : (
//                 <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
//                   {(authUser?.name?.charAt(0) || 'U')}
//                 </div>
//               )}
//             </div>
//             <div>
//               <p className="font-semibold">{authUser?.name ? authUser.name : (authUser?.username || 'User')}</p>
//               <button
//                 type="button"
//                 onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
//                 className="flex items-center gap-2 mt-0.5 text-sm"
//               >
//                 <span>{privacyOptions.find(p => p.value === privacy)?.icon}</span>
//                 <span>{privacyOptions.find(p => p.value === privacy)?.label}</span>
//                 <span className="text-gray-600">• {privacyOptions.find(p => p.value === privacy)?.description}</span>
//               </button>
//             </div>
//           </div>

//           {/* Content Input */}
//           <div className="relative">
//             <Textarea
//               placeholder="What's happening? Share your thoughts, experiences, or moments..."
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               className="min-h-[120px] border-0 bg-transparent resize-none text-base placeholder:text-gray-600 focus-visible:ring-0 p-0"
//               maxLength={maxCharacters}
//             />
//           </div>

//           {/* Quick Actions */}
//           <div className="flex items-center gap-2">
//             <button type="button" className="text-blue-500" onClick={() => setContent(prev => prev + '@')}>
//               <AtSign className="h-5 w-5" />
//             </button>
//             <button type="button" className="text-purple-500" onClick={() => setContent(prev => prev + '#')}>
//               <Hash className="h-5 w-5" />
//             </button>
//             <button type="button" className="text-yellow-500" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
//               😊
//             </button>
//             {!showEmojiPicker && (
//               <div className="flex gap-1 ml-2 border-l border-gray-200 pl-2">
//                 {['😀', '😂', '😍'].map((emoji) => (
//                   <button
//                     key={emoji}
//                     onClick={() => addEmoji(emoji)}
//                     className="hover:bg-gray-100 p-1 rounded"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Emoji Picker */}
//           {showEmojiPicker && (
//             <div className="absolute z-20 bg-white border rounded-lg shadow-lg p-3">
//               <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
//                 {Array.from({ length: 80 }, (_, i) => String.fromCodePoint(0x1F600 + i)).map((emoji, idx) => (
//                   <button
//                     key={idx}
//                     onClick={() => addEmoji(emoji)}
//                     className="text-xl hover:bg-gray-100 p-1 rounded"
//                   >
//                     {emoji}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Image Upload Area */}
//           <div
//             className="border border-dashed border-gray-300 rounded-lg p-6 text-center"
//             onDragOver={(e) => e.preventDefault()}
//             onDrop={(e) => {
//               e.preventDefault();
//               const files = Array.from(e.dataTransfer.files);
//               const imageFiles = files.filter(file => file.type.startsWith('image/'));
//               if (imageFiles.length > 0) {
//                 const newImages = imageFiles.slice(0, maxImages).map((file) => ({
//                   id: Math.random().toString(36).slice(2),
//                   file,
//                   url: URL.createObjectURL(file)
//                 }));
//                 handleImageUpload(newImages);
//               }
//             }}
//           >
//             {images.length === 0 ? (
//               <div>
//                 <div className="flex justify-center mb-4">
//                   <div className="p-3 rounded-full bg-gray-100">
//                     <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                     </svg>
//                   </div>
//                 </div>
//                   <h3 className="text-gray-900 font-medium mb-2">Add photos to your post</h3>
//                   <p className="text-gray-700 text-sm mb-4">Drag and drop up to {maxImages} photos, or click to browse</p>
//                   <p className="text-gray-500 text-xs mb-4">Supports JPG, PNG, GIF • Max 10MB per image</p>
//                 <div className="flex justify-center gap-2">
//                   <Button
//                     onClick={() => fileInputRef.current?.click()}
//                     className="bg-blue-500 hover:bg-blue-600 text-white"
//                   >
//                     Browse Files
//                   </Button>
//                   <Button
//                     variant="outline"
//                     className="border-gray-300 text-gray-700"
//                     onClick={() => {/* Handle camera */}}
//                   >
//                     Take Photo
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <div className={`grid ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
//                 {images.map((img) => (
//                   <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
//                     <img src={img.url} alt="" className="w-full h-full object-cover" />
//                     <button
//                       onClick={() => removeImage(img.id)}
//                       className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/75 rounded-full text-white"
//                     >
//                       ✕
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               multiple
//               className="hidden"
//               onChange={(e) => {
//                 const files = Array.from(e.target.files || []);
//                 const newImages = files.slice(0, maxImages - images.length).map((file) => ({
//                   id: Math.random().toString(36).slice(2),
//                   file,
//                   url: URL.createObjectURL(file)
//                 }));
//                 handleImageUpload(newImages);
//                 e.target.value = '';
//               }}
//             />
//           </div>

//           {/* Add to your post */}
//           <div className="border-t border-gray-200 mt-6 pt-4">
//             <p className="text-sm font-medium text-gray-900 mb-3">Add to your post</p>
//             <div className="grid grid-cols-4 gap-2">
//               <button 
//                 type="button"
//                 onClick={() => fileInputRef.current?.click()}
//                 className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50"
//               >
//                 <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                 </svg>
//                 <span className="text-xs">Photo</span>
//               </button>
//               <button 
//                 type="button"
//                 className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50"
//               >
//                 <Camera className="h-5 w-5 text-green-500" />
//                 <span className="text-xs">Camera</span>
//               </button>
//               <button 
//                 type="button"
//                 className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50"
//               >
//                 <MapPin className="h-5 w-5 text-red-500" />
//                 <span className="text-xs">Location</span>
//               </button>
//               <button 
//                 type="button"
//                 className="flex flex-col items-center gap-1 p-2 rounded hover:bg-gray-50"
//               >
//                 <Hash className="h-5 w-5 text-purple-500" />
//                 <span className="text-xs">Tag</span>
//               </button>
//             </div>
//           </div>

//           {/* Privacy Settings */}
//           {showPrivacyDropdown && (
//             <div className="privacy-dropdown fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
//               <div className="bg-white w-80 rounded-lg shadow-xl">
//                 <div className="p-4 border-b border-gray-200">
//                   <h3 className="font-semibold">Who can see your post?</h3>
//                 </div>
//                 <div className="p-2">
//                   {privacyOptions.map((option) => (
//                     <button
//                       key={option.value}
//                       onClick={() => {
//                         setPrivacy(option.value);
//                         setShowPrivacyDropdown(false);
//                       }}
//                       className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
//                         privacy === option.value ? 'bg-blue-50' : 'hover:bg-gray-50'
//                       }`}
//                     >
//                       <span className="text-xl">{option.icon}</span>
//                       <div className="text-left flex-1">
//                         <p className="font-medium text-sm">{option.label}</p>
//                         <p className="text-xs text-gray-600">{option.description}</p>
//                       </div>
//                       {privacy === option.value && (
//                         <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
//                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                         </svg>
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}
//           </React.Fragment>
//           ) : (
//             <div className="prose prose-sm max-w-none">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="relative">
//                   {authUser?.avatar ? (
//                     <img
//                       src={authUser.avatar}
//                       alt={authUser?.name || 'User'}
//                       className="h-10 w-10 rounded-full bg-gray-200 object-cover"
//                       onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
//                     />
//                   ) : (
//                     <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
//                       {(authUser?.name?.charAt(0) || 'U')}
//                     </div>
//                   )}
//                 </div>
//                 <div>
//                   <p className="font-semibold">{authUser?.name ? authUser.name : (authUser?.username || 'User')}</p>
//                   <div className="flex items-center gap-2 text-sm text-gray-600">
//                     <span>{privacyOptions.find(p => p.value === privacy)?.icon}</span>
//                     <span>{privacyOptions.find(p => p.value === privacy)?.label}</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="whitespace-pre-wrap mb-4">{content}</div>
//               {images.length > 0 && (
//                 <div className={`grid ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
//                   {images.map((img) => (
//                     <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
//                       <img src={img.url} alt="" className="w-full h-full object-cover" />
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CreatePost;