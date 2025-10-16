// Format time for posts/comments (relative time)
export function formatTime(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now - targetDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  }).format(targetDate);
}

// Format time for messages (absolute time with context)
export function formatMessageTime(date) {
  const messageDate = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  if (messageDay.getTime() === today.getTime()) {
    // Today - show time only
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else if (messageDay.getTime() === yesterday.getTime()) {
    // Yesterday
    return "Yesterday " + messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else if (now.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
    // Within a week - show day and time
    return messageDate.toLocaleDateString("en-US", { weekday: "short" }) + " " +
           messageDate.toLocaleTimeString("en-US", {
             hour: "2-digit",
             minute: "2-digit",
             hour12: true,
           });
  } else {
    // Older than a week - show date and time
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) + " " + messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

// Count total comments including nested replies
export function countTotalComments(comments) {
  if (!comments || !Array.isArray(comments)) return 0;
  
  let count = 0;
  comments.forEach(comment => {
    count++; // Count the comment itself
    // Count all nested replies recursively
    const replies = comment.repliesPreview || comment.replies || [];
    if (replies.length > 0) {
      count += countTotalComments(replies);
    }
  });
  return count;
}