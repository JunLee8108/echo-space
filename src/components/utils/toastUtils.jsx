// utils/toastUtils.jsx
import toast from "react-hot-toast";

export function showAffinityToast(
  successResults,
  allCharacters,
  affinityUpdates
) {
  const successCount = successResults.length;

  // 성공한 캐릭터 정보 가져오기
  const successCharacters = allCharacters.filter((char) =>
    successResults.some(
      (result) =>
        result.character_id === char.id ||
        (result.success !== false &&
          affinityUpdates.some((update) => update.characterId === char.id))
    )
  );

  let message = "";

  if (successCount === 1) {
    message = `Affinity with ${successCharacters[0].name} increased!`;
  } else if (successCount === 2) {
    message = `Affinity with ${successCharacters[0].name}, ${successCharacters[1].name} increased!`;
  } else {
    message = `Affinity with ${successCount} characters increased!`;
  }

  // 커스텀 Toast 컴포넌트
  toast.custom((t) => (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
              <span className="text-pink-500 animate-pulse">💕</span>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Affinity Up!</p>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.remove(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-medium text-pink-600 hover:text-pink-500 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  ));
}
