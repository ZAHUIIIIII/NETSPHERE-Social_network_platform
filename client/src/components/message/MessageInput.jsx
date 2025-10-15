import { useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isLoading) return; // Prevent duplicate sends

    setIsLoading(true);
    
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-3 lg:p-4 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors duration-200"
              type="button"
            >
              <X className="size-2" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Click send to share this image</p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 bg-gray-50/80 border border-gray-200/60 rounded-2xl p-2 focus-within:border-blue-300 focus-within:bg-white transition-all duration-200 min-h-[40px]">
          <div className="flex items-center gap-2">
            {/* Text Input */}
            <textarea
              className="flex-1 bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-500 text-xs lg:text-sm leading-relaxed max-h-24 min-h-[20px] overflow-hidden"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              rows={1}
              style={{ height: '20px' }}
            />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Image Upload Button */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                type="button"
                className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200 group flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className={`size-4 transition-colors ${
                  imagePreview ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                }`} />
              </button>
              
                            
              {/* Emoji Button */}
              <button
                type="button"
                className="p-1 hover:bg-gray-200 rounded-full transition-colors duration-200 group flex-shrink-0"
              >
                <Smile className="size-4 text-gray-500 group-hover:text-yellow-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !imagePreview) || isLoading}
          className={`h-[32px] w-[32px] rounded-xl transition-all duration-200 shadow-lg flex-shrink-0 flex items-center justify-center ${
            ((!text.trim() && !imagePreview) || isLoading)
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:shadow-xl transform hover:scale-105"
          }`}
        >
          <Send className="size-3" />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;