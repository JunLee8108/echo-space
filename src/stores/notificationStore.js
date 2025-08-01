// stores/notificationStore.js
import { create } from "zustand";

const useNotificationStore = create((set) => ({
  notificationCount: 0,
  // timeouts를 외부로 빼서 store 상태에 포함시키지 않음

  incrementNotificationCount: () => {
    const timeoutId = setTimeout(() => {
      set((state) => ({
        notificationCount: Math.max(0, state.notificationCount - 1),
      }));
    }, 5000);

    set((state) => ({
      notificationCount: state.notificationCount + 1,
    }));

    // cleanup을 위해 timeoutId 반환
    return timeoutId;
  },

  decrementNotificationCount: () => {
    set((state) => ({
      notificationCount: Math.max(0, state.notificationCount - 1),
    }));
  },

  setNotificationCount: (count) => {
    set({ notificationCount: count });
  },

  clearAllNotifications: () => {
    set({ notificationCount: 0 });
  },
}));

// Selectors
export const useNotificationCount = () =>
  useNotificationStore((state) => state.notificationCount);
export const useNotificationActions = () =>
  useNotificationStore((state) => ({
    incrementNotificationCount: state.incrementNotificationCount,
    decrementNotificationCount: state.decrementNotificationCount,
    setNotificationCount: state.setNotificationCount,
    clearAllNotifications: state.clearAllNotifications,
  }));

// 간편한 increment 함수 (timeout 관리 포함)
let timeoutIds = new Set();

export const incrementNotification = () => {
  const { incrementNotificationCount } = useNotificationStore.getState();

  const timeoutId = setTimeout(() => {
    const { decrementNotificationCount } = useNotificationStore.getState();
    decrementNotificationCount();
    timeoutIds.delete(timeoutId);
  }, 5000);

  timeoutIds.add(timeoutId);
  incrementNotificationCount();
};

// Cleanup 함수
export const cleanupNotifications = () => {
  timeoutIds.forEach((id) => clearTimeout(id));
  timeoutIds.clear();
};

export default useNotificationStore;
