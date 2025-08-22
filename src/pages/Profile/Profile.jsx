// Profile.jsx - 캐릭터 5개 제한 표시 및 더보기 기능 구현

import { useState } from "react";

import { UserRoundCheck, ChevronDown, ChevronUp, Users } from "lucide-react";

// Zustand hooks
import {
  useCharacters,
  useFollowedCharacterIds,
  useCharacterLoading,
  useCharacterActions,
} from "../../stores/characterStore";

// userStore imports
import {
  useUser,
  useDisplayName,
  useUserLanguage,
  useUserActions,
} from "../../stores/userStore";

import { createTranslator } from "../../components/utils/translations";

import ProfileModal from "../../components/UI/ProfileModal";
import EditProfileModal from "./EditProfileModal";
import ConfirmationModal from "../../components/UI/ConfirmationModal";
import { Pencil } from "lucide-react";

const Profile = () => {
  // userStore hooks
  const user = useUser();
  const displayName = useDisplayName();
  const userLanguage = useUserLanguage();
  const { updateDisplayName, updateLanguage, updatePassword } =
    useUserActions();

  const translate = createTranslator(userLanguage);

  // characterStore hooks
  const characters = useCharacters();
  const followedCharacterIds = useFollowedCharacterIds();
  const contextLoading = useCharacterLoading();
  const { toggleFollow, batchToggleFollow } = useCharacterActions();

  const [localLoading, setLocalLoading] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // 배치 처리를 위한 상태들
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: null,
    title: "",
    message: "",
  });

  // Quick Action 창 토글을 위한 상태들
  const [showQuickActions, setShowQuickActions] = useState(false);

  // 캐릭터 표시 개수 제어를 위한 상태 추가
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5; // 초기 표시 개수

  // 기존 개별 토글 핸들러
  const handleToggleFollow = async (character) => {
    setLocalLoading(true);
    try {
      await toggleFollow(character);
    } catch {
      alert("Failed to change follow status.");
    } finally {
      setLocalLoading(false);
    }
  };

  // 전체 팔로우 확인 다이얼로그 표시
  const handleFollowAll = () => {
    const unfollowedCharacters = characters.filter(
      (character) => !followedCharacterIds.has(character.id)
    );

    if (unfollowedCharacters.length === 0) {
      alert("All AI characters are already being followed.");
      return;
    }

    const count = unfollowedCharacters.length;

    setConfirmModal({
      show: true,
      type: "followAll",
      title: translate("confirm.followAllTitle"),
      message: translate("confirm.followAllMessage", { count }),
    });
  };

  // 전체 언팔로우 확인 다이얼로그 표시
  const handleUnfollowAll = () => {
    const followedCount = followedCharacterIds.size;

    if (followedCount === 0) {
      alert("No AI characters are currently being followed.");
      return;
    }

    setConfirmModal({
      show: true,
      type: "unfollowAll",
      title: translate("confirm.unfollowAllTitle"),
      message: translate("confirm.unfollowAllMessage", {
        count: followedCount,
      }),
    });
  };

  // 실제 전체 팔로우 실행
  const executeFollowAll = async () => {
    setBulkLoading(true);
    try {
      const unfollowedCharacterIds = characters
        .filter((character) => !followedCharacterIds.has(character.id))
        .map((character) => character.id);

      if (unfollowedCharacterIds.length === 0) {
        alert("All AI characters are already being followed.");
        return;
      }

      const result = await batchToggleFollow(unfollowedCharacterIds, true);

      if (result.failCount > 0) {
        alert(
          `Partially completed: ${result.processedCount} followed successfully, ${result.failCount} failed, ${result.skippedCount} were already followed.`
        );
      } else if (result.skippedCount > 0) {
        alert(
          `All ${result.skippedCount} AI characters were already being followed.`
        );
      }
    } catch (error) {
      console.error("Bulk follow error:", error);
      alert("Failed to follow all AI characters. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  // 실제 전체 언팔로우 실행
  const executeUnfollowAll = async () => {
    setBulkLoading(true);
    try {
      const followedCharacterIdsArray = Array.from(followedCharacterIds);

      if (followedCharacterIdsArray.length === 0) {
        alert("No AI characters are currently being followed.");
        return;
      }

      const result = await batchToggleFollow(followedCharacterIdsArray, false);

      if (result.failCount > 0) {
        alert(
          `Partially completed: ${result.processedCount} unfollowed successfully, ${result.failCount} failed, ${result.skippedCount} were already unfollowed.`
        );
      } else if (result.skippedCount > 0) {
        alert(
          `All ${result.skippedCount} AI characters were already unfollowed.`
        );
      }
    } catch (error) {
      console.error("Bulk unfollow error:", error);
      alert("Failed to unfollow all AI characters. Please try again.");
    } finally {
      setBulkLoading(false);
    }
  };

  // 확인 모달에서 실행할 액션 결정
  const handleConfirmModalAction = () => {
    if (confirmModal.type === "followAll") {
      executeFollowAll();
    } else if (confirmModal.type === "unfollowAll") {
      executeUnfollowAll();
    }
  };

  // 기존 핸들러들은 그대로 유지
  const handleUpdateDisplayName = async (newName) => {
    try {
      await updateDisplayName(newName);
    } catch (error) {
      alert("Failed to update display name.");
      console.error("Error updating display name:", error);
      throw error;
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    try {
      await updateLanguage(newLanguage);
    } catch (error) {
      alert("Failed to update language.");
      console.error("Error updating language:", error);
      throw error;
    }
  };

  const handlePasswordChange = async (currentPassword, newPassword) => {
    try {
      await updatePassword(currentPassword, newPassword);
    } catch (error) {
      console.error("Password change error:", error);
      throw error;
    }
  };

  const [profileModal, setProfileModal] = useState({
    show: false,
    character: null,
  });

  // 표시할 캐릭터 결정
  const displayedCharacters = showAllCharacters
    ? characters
    : characters.slice(0, INITIAL_DISPLAY_COUNT);

  const remainingCount = characters.length - INITIAL_DISPLAY_COUNT;
  const hasMoreCharacters = characters.length > INITIAL_DISPLAY_COUNT;

  // 상태 결정 함수
  const getCharacterStatus = () => {
    const random = Math.random();
    if (random < 0.6) return "online"; // 60% - 초록색
    if (random < 0.85) return "away"; // 25% - 주황색
    return "offline"; // 15% - 회색
  };

  // 상태별 스타일 매핑
  const statusStyles = {
    online: {
      bg: "bg-green-400",
      title: "Online",
    },
    away: {
      bg: "bg-orange-400",
      title: "Away",
    },
    offline: {
      bg: "bg-gray-400",
      title: "Offline",
    },
  };

  // 첫 로딩 시에만 각 캐릭터의 상태 결정 (lazy initial state)
  const [characterStatuses] = useState(() => {
    const statuses = {};
    characters.forEach((character) => {
      statuses[character.id] = getCharacterStatus();
    });
    return statuses;
  });

  // Show loading state if context is still loading
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Section - 기존과 동일 */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-stone-600 to-stone-800 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-lg text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900">
                  {displayName}
                </h1>
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all"
                  title="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <p className="text-stone-600 text-xs">
                {translate("profile.managingUserInfo")}
              </p>
            </div>
          </div>
        </div>

        {/* Settings Hint - 기존과 동일 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                {translate("profile.proTip")}
              </p>
              <p className="text-sm text-blue-700">
                {translate("profile.proTipMessage")}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section - 기존과 동일 */}
        <div className="bg-stone-50 rounded-2xl p-6 mb-4">
          <h3 className="font-semibold text-center text-stone-900 mb-4">
            {translate("profile.interactionStats")}
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900 mb-1">
                {followedCharacterIds.size}
              </div>
              <div className="text-sm text-stone-600">
                {translate("profile.active")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-stone-900 mb-1">
                {characters.length - followedCharacterIds.size}
              </div>
              <div className="text-sm text-stone-600">
                {translate("profile.inactive")}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-500 leading-relaxed">
              {translate("profile.followedOnlyHint")}
            </p>
          </div>
        </div>

        {/* Following Section */}
        <div>
          {/* 헤더 */}
          <div className="mb-4 flex justify-between">
            <h2 className="text-md font-bold text-stone-900">
              {translate("profile.aiCharacters")}
            </h2>
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{followedCharacterIds.size} followed</span>
            </div>
          </div>

          {/* Quick Actions - 기존과 동일 */}
          {(followedCharacterIds.size < characters.length ||
            followedCharacterIds.size > 0) && (
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
              <div
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 text-sm">
                      {translate("profile.quickActions")}
                    </h3>
                    <p className="text-xs text-stone-600">
                      {translate("profile.manageCompanions")}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 hover:bg-white/50 rounded-lg transition-all duration-200">
                  <ChevronDown
                    className={`w-5 h-5 text-stone-600 transition-transform duration-300 ${
                      showQuickActions ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </div>

              <div
                className={`grid grid-cols-2 gap-3 overflow-hidden transition-all duration-300 ${
                  showQuickActions ? "mt-4 block" : "hidden"
                }`}
              >
                {followedCharacterIds.size < characters.length && (
                  <button
                    onClick={handleFollowAll}
                    disabled={bulkLoading || localLoading || contextLoading}
                    className="group relative overflow-hidden bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex items-center justify-center gap-2">
                      {bulkLoading && confirmModal.type === "followAll" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span className="font-medium text-xs">
                            Following...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-xs">
                            {translate("profile.followAll")}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                )}

                {followedCharacterIds.size > 0 && (
                  <button
                    onClick={handleUnfollowAll}
                    disabled={bulkLoading || localLoading || contextLoading}
                    className="group relative overflow-hidden bg-white hover:bg-stone-50 text-stone-700 rounded-xl py-3 px-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {bulkLoading && confirmModal.type === "unfollowAll" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-stone-400 border-t-transparent"></div>
                          <span className="font-medium text-xs">
                            Unfollowing...
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-xs">
                            {translate("profile.unfollowAll")}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Characters Grid - 수정된 부분 */}
          <div className="space-y-3">
            {displayedCharacters.map((character) => {
              const isFollowed = followedCharacterIds.has(character.id);
              // 온라인 상태 (없으면 기본값 online)
              const status = characterStatuses[character.id] || "online";
              const statusStyle = statusStyles[status];

              return (
                <div
                  key={character.id}
                  className="bg-white rounded-2xl border border-stone-100 p-4 hover:border-stone-200 transition-all duration-200"
                >
                  <div className="flex flex-wrap items-center justify-end gap-4 sm:flex-nowrap sm:gap-0 sm:justify-between">
                    <div className="flex items-center space-x-4 mr-6">
                      {/* Character Avatar */}
                      <div className="relative">
                        {character.avatar_url ? (
                          <img
                            src={character.avatar_url}
                            alt={character.name}
                            className="w-14 h-14 cursor-pointer rounded-2xl object-cover shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileModal({
                                show: true,
                                character: character,
                              });
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          className="w-14 h-14 bg-gradient-to-br from-stone-500 to-stone-700 rounded-2xl flex items-center justify-center shadow-sm"
                          style={{
                            display: character.avatar_url ? "none" : "flex",
                          }}
                        >
                          <span className="text-white text-lg font-bold">
                            {character.name.charAt(0)}
                          </span>
                        </div>

                        {/* Online indicator */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusStyle.bg} border-2 border-white rounded-full`}
                          title={statusStyle.title}
                        />
                      </div>

                      {/* Character Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-900 mb-1">
                          {character.name}
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed line-clamp-2">
                          {character.description}.
                        </p>
                      </div>
                    </div>

                    {/* Follow Button */}
                    <button
                      onClick={() => handleToggleFollow(character)}
                      disabled={localLoading || contextLoading || bulkLoading}
                      className={`flex justify-center px-4 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 min-w-[90px] ${
                        isFollowed
                          ? "bg-stone-700 text-white hover:bg-stone-800"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {localLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        </div>
                      ) : isFollowed ? (
                        <span className="flex items-center gap-1">
                          <UserRoundCheck className="w-3 h-3" />
                          {translate("profile.following")}
                        </span>
                      ) : (
                        `${translate("profile.follow")}`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* 더보기/접기 버튼 - 새로 추가 */}
            {hasMoreCharacters && (
              <button
                onClick={() => setShowAllCharacters(!showAllCharacters)}
                className="w-full mt-4 p-4 bg-gradient-to-r from-stone-50 to-stone-100 hover:from-stone-100 hover:to-stone-150 rounded-2xl border border-stone-200 transition-all duration-200 group"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-stone-600 group-hover:text-stone-700" />
                    <span className="text-sm font-medium text-stone-700 group-hover:text-stone-800">
                      {showAllCharacters
                        ? translate("profile.showLess")
                        : translate("profile.showMore", {
                            count: remainingCount,
                          })}
                    </span>
                  </div>
                  {showAllCharacters ? (
                    <ChevronUp className="w-5 h-5 text-stone-500 group-hover:text-stone-600 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-stone-500 group-hover:text-stone-600 transition-transform duration-200" />
                  )}
                </div>
                {!showAllCharacters && (
                  <p className="text-xs text-stone-500 mt-2">
                    {translate("profile.showingCount", {
                      shown: INITIAL_DISPLAY_COUNT,
                      total: characters.length,
                    })}
                  </p>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 기존 모달들 */}
      <ProfileModal
        isOpen={profileModal.show}
        onClose={() => setProfileModal({ show: false, character: null })}
        character={profileModal.character}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        onConfirm={handleUpdateDisplayName}
        currentName={user?.user_metadata?.display_name || ""}
        currentLanguage={userLanguage}
        onPasswordChange={handlePasswordChange}
        onLanguageChange={handleLanguageChange}
      />

      {/* 확인 모달 */}
      <ConfirmationModal
        isOpen={confirmModal.show}
        onClose={() =>
          setConfirmModal({ show: false, type: null, title: "", message: "" })
        }
        onConfirm={handleConfirmModalAction}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={translate("confirm.yes")}
        cancelText={translate("common.cancel")}
        confirmButtonClass={
          confirmModal.type === "unfollowAll"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-sky-600 hover:bg-sky-700"
        }
        icon={confirmModal.type === "unfollowAll" ? "warning" : "info"}
      />
    </div>
  );
};

export default Profile;
