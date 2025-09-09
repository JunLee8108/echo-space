// // src/components/hooks/usePost.js
// import { useQuery } from "@tanstack/react-query";
// import { fetchSinglePost } from "../../services/postService";
// import { useUserId } from "../../stores/userStore";

// export const usePost = (postId) => {
//   const userId = useUserId();

//   return useQuery({
//     queryKey: ["post", postId, userId],
//     queryFn: () => fetchSinglePost(postId, userId),
//     enabled: !!postId && !!userId,
//     staleTime: 30 * 1000, // 30초
//     gcTime: 5 * 60 * 1000, // 5분
//     retry: (failureCount, error) => {
//       // 404 에러는 재시도하지 않음
//       if (error.message?.includes("찾을 수 없거나")) {
//         return false;
//       }
//       return failureCount < 2;
//     },
//   });
// };
