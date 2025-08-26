// src/pages/Search/UserSearchItem.jsx
import { useState } from "react";
import { UserCircle, Calendar, MessageCircle, FileText } from "lucide-react";
import ProfileModal from "../../components/UI/ProfileModal";

const UserSearchItem = ({ user, query, highlightText }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 프로필 사진 렌더링
  const renderAvatar = () => {
    // User_Profile에는 avatar_url이 없으므로 기본 아바타 표시
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-stone-400 to-stone-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white font-bold text-xs">
          {user.display_name?.charAt(0).toUpperCase() || "U"}
        </span>
      </div>
    );
  };

  // 사용자 정보를 ProfileModal 형식에 맞게 변환
  const getUserProfile = () => {
    return {
      id: user.id,
      name: user.display_name,
      character: user.display_name,
      isUser: true, // 실제 사용자임을 표시
      // ProfileModal에서 필요한 추가 필드
      description: `User since ${new Date(
        user.created_at || Date.now()
      ).toLocaleDateString()}`,
      personality: [],
      avatar_url: null,
    };
  };

  return (
    <>
      <div
        className="user-item p-4 hover:bg-stone-50 transition-colors cursor-pointer"
        onClick={() => setShowProfileModal(true)}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {renderAvatar()}

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-stone-900 truncate">
                {highlightText(user.display_name || "Anonymous User", query)}
              </h4>
            </div>

            {/* User Stats */}
            {(user.post_count !== undefined ||
              user.comment_count !== undefined) && (
              <div className="flex items-center gap-4 mt-2">
                {user.post_count !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <FileText className="w-3 h-3" />
                    <span>{user.post_count || 0} posts</span>
                  </div>
                )}

                {user.comment_count !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MessageCircle className="w-3 h-3" />
                    <span>{user.comment_count || 0} comments</span>
                  </div>
                )}
              </div>
            )}

            {/* Bio or additional info if available */}
            {user.bio && (
              <p className="text-sm text-stone-600 mt-2 line-clamp-2">
                {highlightText(user.bio, query)}
              </p>
            )}
          </div>

          {/* View Profile Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileModal(true);
            }}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
          >
            View
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        character={getUserProfile()}
      />
    </>
  );
};

export default UserSearchItem;
