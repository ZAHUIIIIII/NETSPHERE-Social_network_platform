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