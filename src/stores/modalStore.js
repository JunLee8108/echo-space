import { create } from "zustand";

const useModalStore = create((set, get) => ({
  // States
  isPostModalOpen: false,
  scrollPosition: 0,

  // Actions
  openPostModal: () => {
    const currentScrollY = window.scrollY;

    set({
      isPostModalOpen: true,
      scrollPosition: currentScrollY,
    });

    // Body scroll lock
    document.body.style.top = `-${currentScrollY}px`;

    // Add modal-open class with delay for animation
    setTimeout(() => {
      document.body.classList.add("modal-open");
    }, 600);
  },

  closePostModal: () => {
    const { scrollPosition } = get();

    // Remove modal-open class
    document.body.classList.remove("modal-open");

    // Reset body styles
    document.body.style.top = "";

    // Restore scroll position
    window.scrollTo(0, scrollPosition);

    set({
      isPostModalOpen: false,
      scrollPosition: 0,
    });
  },

  // Cleanup function for unmount
  cleanup: () => {
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
  },
}));

// Selectors
export const useIsPostModalOpen = () =>
  useModalStore((state) => state.isPostModalOpen);
export const useOpenPostModal = () =>
  useModalStore((state) => state.openPostModal);
export const useClosePostModal = () =>
  useModalStore((state) => state.closePostModal);
export const useModalCleanup = () => useModalStore((state) => state.cleanup);

export default useModalStore;
