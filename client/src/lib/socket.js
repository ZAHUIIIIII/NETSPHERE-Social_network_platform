// Socket utilities for post room management

export const joinPostRoom = (socket, postId) => {
  if (!socket || !postId) return;
  socket.emit('join-post', postId);
  console.log(`📍 Joined post room: ${postId}`);
};

export const leavePostRoom = (socket, postId) => {
  if (!socket || !postId) return;
  socket.emit('leave-post', postId);
  console.log(`📍 Left post room: ${postId}`);
};

export const subscribeToCommentEvents = (socket, handlers = {}) => {
  if (!socket) return () => {};

  const {
    onNewComment,
    onCommentUpdated,
    onCommentDeleted,
    onCommentReacted
  } = handlers;

  // Register listeners
  if (onNewComment) {
    socket.on('comment:new', onNewComment);
  }
  if (onCommentUpdated) {
    socket.on('comment:updated', onCommentUpdated);
  }
  if (onCommentDeleted) {
    socket.on('comment:deleted', onCommentDeleted);
  }
  if (onCommentReacted) {
    socket.on('comment:reacted', onCommentReacted);
  }

  // Return cleanup function
  return () => {
    if (onNewComment) socket.off('comment:new', onNewComment);
    if (onCommentUpdated) socket.off('comment:updated', onCommentUpdated);
    if (onCommentDeleted) socket.off('comment:deleted', onCommentDeleted);
    if (onCommentReacted) socket.off('comment:reacted', onCommentReacted);
  };
};
