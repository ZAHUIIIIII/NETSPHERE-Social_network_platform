// Format time for posts/comments (relative time)
export function formatTime(date) {
  // Handle invalid or missing date
  if (!date) return 'just now';
  
  const now = new Date();
  const targetDate = new Date(date);
  
  // Check if date is invalid
  if (isNaN(targetDate.getTime())) {
    console.error('Invalid date passed to formatTime:', date);
    return 'just now';
  }
  
  const diffMs = now - targetDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(targetDate);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'just now';
  }
}

// Format time for messages (in chat) - detailed time
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

/**
 * SHORT TIME LABEL 
 * 
 * Format timestamp into short, non-hover time labels per spec requirements:
 * - < 60s: "Just now"
 * - < 60m: "Xm" (e.g., "5m")
 * - < 24h: "Xh" (e.g., "3h")
 * - Yesterday: "Yesterday HH:mm" (e.g., "Yesterday 14:30")
 * - Same year: "DD MMM HH:mm" (e.g., "16 Oct 08:45")
 * - Different year: "DD MMM YYYY" (e.g., "16 Oct 2024")
 * 
 * @param {string|Date} dateISO - ISO date string or Date object
 * @returns {string} Formatted time label
 */
export function shortTimeLabel(dateISO) {
  const d = new Date(dateISO);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000; // seconds

  // Less than 60 seconds
  if (diff < 60) return "Just now";
  
  // Less than 60 minutes
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  
  // Less than 24 hours
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;

  // Helper to compare dates (ignoring time)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  // Helper for zero-padding
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Yesterday
  if (dOnly.getTime() === yest.getTime()) {
    return `Yesterday ${hhmm}`;
  }

  // Same year or different year
  const sameYear = d.getFullYear() === now.getFullYear();
  const dStr = d.toLocaleString("en-GB", { day: "2-digit", month: "short" });
  
  return sameYear ? `${dStr} ${hhmm}` : `${dStr} ${d.getFullYear()}`;
}

/**
 * FORMAT LAST ACTIVE TIME FOR ADMIN USER MANAGEMENT
 * 
 * Format last active timestamp for admin panel user table:
 * - < 1 minute: "Just now"
 * - < 60 minutes: "Xm ago" (e.g., "5m ago")
 * - < 24 hours: "Xh ago" (e.g., "3h ago")
 * - < 7 days: "Xd ago" (e.g., "2d ago")
 * - >= 7 days: "DD MMM YYYY" (e.g., "16 Oct 2024")
 * 
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted last active time
 */
export function formatLastActive(date) {
  if (!date) return 'Never';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

// ==================== DEPRECATED FUNCTIONS ====================
// Count total comments including nested replies (Legacy system only)
// For unlimited nesting system, use countTotalComments from commentApi.js
export function countTotalComments(comments) {
  if (!comments || !Array.isArray(comments)) return 0;
  
  // For embedded comments (legacy system):
  // Only count root-level comments + their direct replies (two-level system)
  let count = 0;
  
  comments.forEach(comment => {
    count++; // Count the comment itself
    
    // In the embedded system, replies are at the same level with parentId
    // Don't recursively count - they're already in the flat array
  });
  
  return count;
}

// Alternative: Deep recursive count (if needed for nested structures)
export function countTotalCommentsRecursive(comments) {
  if (!comments || !Array.isArray(comments)) return 0;
  
  let count = 0;
  comments.forEach(comment => {
    count++; // Count the comment itself
    // Count all nested replies recursively
    const replies = comment.repliesPreview || comment.replies || [];
    if (replies.length > 0) {
      count += countTotalCommentsRecursive(replies);
    }
  });
  return count;
}