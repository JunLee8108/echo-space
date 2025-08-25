// src/pages/Search/PostSearchItem.jsx - 해시태그 검색 제거 버전
import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Hash,
  Calendar,
  Globe,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router";

const PostSearchItem = ({ post, query, highlightText, animationDelay = 0 }) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // HTML 태그 제거 및 텍스트 추출
  const extractTextFromHtml = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  // 이미지 추출
  const extractFirstImage = (html) => {
    const imgMatch = html.match(/<img[^>]+src="([^">]+)"/);
    return imgMatch ? imgMatch[1] : null;
  };

  const plainContent = extractTextFromHtml(post.content);
  const firstImage = extractFirstImage(post.content);
  const truncatedContent =
    plainContent.substring(0, 150) + (plainContent.length > 150 ? "..." : "");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handlePostClick = () => {
    // 포스트 상세 모달 또는 페이지로 이동
    // 현재는 홈으로 이동하고 해당 포스트로 스크롤
    navigate("/", { state: { scrollToPost: post.id } });
  };

  return (
    <div
      className="search-result-item post-item p-4 hover:bg-stone-50 transition-colors cursor-pointer"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={handlePostClick}
    >
      {/* Author Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-stone-400 to-stone-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">
            {post.User_Profile?.display_name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-stone-900">
              {post.User_Profile?.display_name || "Anonymous"}
            </span>
            <span className="text-xs text-stone-400">•</span>
            <span className="text-xs text-stone-400">
              {formatDate(post.created_at)}
            </span>
            {post.visibility === "public" ? (
              <Globe className="w-3 h-3 text-stone-400" />
            ) : (
              <Lock className="w-3 h-3 text-stone-400" />
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-3">
        {/* Text Content */}
        <p className="text-sm text-stone-700 leading-relaxed mb-2">
          {highlightText(truncatedContent, query)}
        </p>

        {/* Image Preview */}
        {firstImage && !imageError && (
          <div className="mt-2 rounded-lg overflow-hidden bg-stone-100">
            <img
              src={firstImage}
              alt="Post image"
              className="w-full h-48 object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* Hashtags - 표시만 하고 클릭 시 검색하지 않음 */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-0.5 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full text-xs transition-colors cursor-pointer"
              >
                <Hash className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-xs text-stone-500">
          <Heart className="w-3.5 h-3.5" />
          <span>{post.likeCount || 0}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-stone-500">
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{post.commentCount || 0}</span>
        </div>

        {post.mood && (
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <span className="capitalize">{post.mood}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostSearchItem;
