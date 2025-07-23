import { useState, useEffect, useRef } from "react";
import PostForm from "./components/PostForm";
import AuthForm from "./components/AuthForm";
import { fetchAIComment } from "./services/openaiService";
import characters from "./data/characters";
import {
  savePostWithCommentsAndLikes,
  fetchPostsWithCommentsAndLikes,
} from "./services/postService";
import supabase from "./services/supabaseClient";
import { getCurrentUser } from "./services/authService";

const getRandomCharacters = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const App = () => {
  /* ──────────────────────────── Auth state ──────────────────────────── */
  const [user, setUser] = useState(null); // 로그인된 유저
  const [loadingUser, setLoadingUser] = useState(true);

  /* ──────────────────────────── Post state ──────────────────────────── */
  const [posts, setPosts] = useState([]);
  const [likeModal, setLikeModal] = useState({
    show: false,
    likes: [],
    postId: null,
  });
  const [optionsModal, setOptionsModal] = useState({
    show: false,
    postId: null,
  });
  const modalRef = useRef(null);
  const optionsModalRef = useRef(null);

  /* ───────── ① 앱 처음 로드: 로그인 체크 → 해당 유저 글 로드 ───────── */
  useEffect(() => {
    (async () => {
      const current = await getCurrentUser();
      setUser(current);
      setLoadingUser(false);
      if (current) loadPostsOfUser(current.id);
    })();
  }, []);

  /* ───────── ② Supabase onAuthStateChange(리프레시/로그아웃 처리) ───────── */
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        const current = session?.user ?? null;
        setUser(current);
        if (current) loadPostsOfUser(current.id);
        else setPosts([]);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  /* ───────── ③ 현재 로그인 유저의 게시글만 가져오기 ───────── */
  const loadPostsOfUser = async (uid) => {
    const data = await fetchPostsWithCommentsAndLikes(uid); // ← user_id 기준 필터
    setPosts(data);
  };

  // useEffect(() => {
  //   const loadPosts = async () => {
  //     const data = await fetchPostsWithCommentsAndLikes();
  //     setPosts(data);
  //   };
  //   loadPosts();
  // }, []);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close like modal
      if (
        likeModal.show &&
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        !e.target.closest(".like-button")
      ) {
        setLikeModal({ show: false, likes: [], postId: null });
      }

      // Close options modal
      if (
        optionsModal.show &&
        optionsModalRef.current &&
        !optionsModalRef.current.contains(e.target) &&
        !e.target.closest(".options-button")
      ) {
        setOptionsModal({ show: false, postId: null });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [likeModal.show, optionsModal.show]);

  const handlePostSubmit = async (post) => {
    const commentCharacters = getRandomCharacters(characters, 2);
    const likeCharacters = getRandomCharacters(
      characters,
      Math.floor(Math.random() * 5) + 1
    );

    const comments = await Promise.all(
      commentCharacters.map(async (char) => {
        const reply = await fetchAIComment(char, post.title, post.content);
        return {
          character: char,
          message: reply,
        };
      })
    );

    try {
      await savePostWithCommentsAndLikes(post, comments, likeCharacters);
    } catch {
      alert("저장 중 오류가 발생했습니다.");
      return;
    }

    // 새 Post + 댓글 + 좋아요를 추가
    setPosts((prev) => [
      {
        ...post,
        id: Date.now(), // 임시 ID (추후 reload 필요)
        Comment: comments.map((c) => ({
          character: c.character.name,
          message: c.message,
        })),
        Post_Like: likeCharacters.map((c) => ({ character: c.name })),
        like: likeCharacters.length,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const formatRelativeTime = (isoString) => {
    const now = new Date();
    const created = new Date(isoString);
    const diffMin = Math.floor((now - created) / 1000 / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return "Just now";
    if (diffHour < 1) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    if (diffHour < 4) return `${diffHour} hour${diffHour > 1 ? "s" : ""} ago`;
    return created.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLikeClick = (e, postId, postLikes) => {
    e.stopPropagation();

    if (!postLikes || postLikes.length === 0) return;

    // 같은 post의 like를 다시 클릭한 경우 모달 닫기
    if (likeModal.show && likeModal.postId === postId) {
      setLikeModal({ show: false, likes: [], postId: null });
      return;
    }

    setLikeModal({
      show: true,
      likes: postLikes,
      postId: postId,
    });
  };

  const handleOptionsClick = (e, postId) => {
    e.stopPropagation();

    // 같은 post의 옵션을 다시 클릭한 경우 모달 닫기
    if (optionsModal.show && optionsModal.postId === postId) {
      setOptionsModal({ show: false, postId: null });
      return;
    }

    setOptionsModal({
      show: true,
      postId: postId,
    });
  };

  const handleDeletePost = (postId) => {
    // 포스트 삭제 로직
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setOptionsModal({ show: false, postId: null });
  };

  if (loadingUser) return <div className="p-8 text-center">Loading…</div>;

  if (!user) {
    /* 로그인/회원가입 화면 */
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <AuthForm
          onAuthSuccess={() => {
            /* onAuthStateChange가 처리 */
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-stone-700 to-stone-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-stone-900">EchoSpace</h1>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Sign Out
            </button>
          </div>

          <nav className="flex items-center space-x-1">
            <button className="p-2 rounded-lg hover:bg-stone-50 transition-colors">
              <svg
                className="w-5 h-5 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button className="p-2 rounded-lg hover:bg-stone-50 transition-colors">
              <svg
                className="w-5 h-5 text-stone-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Enhanced Post Form */}
        <div className="mb-8">
          <div className="bg-stone-50 rounded-2xl p-1">
            <div className="bg-white rounded-xl shadow-sm">
              <PostForm onPostSubmit={handlePostSubmit} />
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-20" style={{ width: "640px" }}>
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-stone-500 font-medium">
                Start the conversation
              </p>
              <p className="text-stone-400 text-sm mt-1">
                Share your first thought
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 transition-all duration-200"
              >
                {/* Post Header */}
                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-stone-600 to-stone-800 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {post.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900">Anonymous</h3>
                      <p className="text-xs text-stone-500">
                        {formatRelativeTime(post.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      className="options-button p-2 hover:bg-stone-50 rounded-lg transition-colors"
                      onClick={(e) => handleOptionsClick(e, post.id)}
                    >
                      <svg
                        className="w-5 h-5 text-stone-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>

                    {/* Options Modal */}
                    {optionsModal.show && optionsModal.postId === post.id && (
                      <div
                        ref={optionsModalRef}
                        className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 py-2 min-w-[160px]"
                      >
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span>Delete</span>
                        </button>
                        {/* 추가 옵션들을 여기에 넣을 수 있습니다 */}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-6 pb-4">
                  <h2 className="text-lg font-semibold text-stone-900 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Comments Section */}
                {post.Comment && post.Comment.length > 0 && (
                  <div className="px-6 pb-3">
                    <div className="border-t border-stone-100 pt-4 space-y-3">
                      {post.Comment.map((c, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-stone-500 to-stone-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-medium">
                              {c.character?.charAt(0) || "A"}
                            </span>
                          </div>
                          <div className="flex-1 bg-stone-50 rounded-2xl px-4 py-2">
                            <p className="text-sm font-medium text-stone-800 mb-0.5">
                              {c.character || "AI Friend"}
                            </p>
                            <p className="text-sm text-stone-600">
                              {c.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Actions - Fixed Icons */}
                <div className="px-6 py-3 border-t border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="relative">
                      <button
                        className="like-button flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                        onClick={(e) =>
                          handleLikeClick(e, post.id, post.Post_Like)
                        }
                      >
                        <svg
                          className="w-5 h-5 text-stone-600"
                          fill={post.like > 0 ? "#FF8DA1" : "none"}
                          stroke={post.like > 0 ? "#FF8DA1" : "currentColor"}
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span className="text-sm text-stone-600">
                          {post.like > 0 ? post.like : "Like"}
                        </span>
                      </button>

                      {/* Like Modal - positioned relative to button */}
                      {likeModal.show && likeModal.postId === post.id && (
                        <div
                          ref={modalRef}
                          className="absolute bottom-full mb-2 left-0 z-50 bg-white rounded-xl shadow-lg border border-stone-200 p-4 min-w-[200px] max-w-xs"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-stone-900 text-sm">
                              Likes
                            </h3>
                            <span className="text-xs text-stone-500">
                              {likeModal.likes.length}
                            </span>
                          </div>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {likeModal.likes.map((like, idx) => (
                              <div
                                key={idx}
                                className="flex items-center space-x-2 py-1"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-xs font-medium">
                                    {like.character?.charAt(0) || "?"}
                                  </span>
                                </div>
                                <span className="text-sm text-stone-700">
                                  {like.character || "Unknown"}
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* 모달 아래 화살표 */}
                          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white border-b border-r border-stone-200 transform rotate-45"></div>
                        </div>
                      )}
                    </div>

                    <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
                      <svg
                        className="w-5 h-5 text-stone-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-sm text-stone-600">Comment</span>
                    </button>
                  </div>

                  <button className="p-2 rounded-lg hover:bg-stone-50 transition-colors">
                    <svg
                      className="w-5 h-5 text-stone-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
