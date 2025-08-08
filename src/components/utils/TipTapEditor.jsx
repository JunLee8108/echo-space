import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Image as BaseImage } from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  Smartphone,
  Tablet,
  Monitor,
  Maximize,
  Square,
  X,
} from "lucide-react";
import { useState, useCallback } from "react";
import "./TipTapEditor.css";

const MenuButton = ({ onClick, isActive, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded transition-all ${
      isActive
        ? "bg-stone-200 text-stone-900"
        : "hover:bg-stone-100 text-stone-600 hover:text-stone-900"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    title={title}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-6 bg-stone-300 mx-1" />;

// Custom Image Extension with additional attributes
const CustomImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      class: {
        default: "w-1/2 max-w-[50%] h-auto rounded-lg",
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
      "data-size": {
        default: "mobile",
        parseHTML: (element) => element.getAttribute("data-size"),
        renderHTML: (attributes) => {
          if (!attributes["data-size"]) {
            return {};
          }
          return {
            "data-size": attributes["data-size"],
          };
        },
      },
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("style"),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }
          return {
            style: attributes.style,
          };
        },
      },
    };
  },

  // Configure options
  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
      allowBase64: true,
      HTMLAttributes: {
        // 이미지에 user-select: none 추가하여 텍스트 선택 방지
        style:
          "user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;",
      },
    };
  },
});

// 색상 팔레트
const COLORS = [
  { name: "Default", color: "var(--color-stone-700)" },
  { name: "Red", color: "#dc2626" },
  { name: "Orange", color: "#ea580c" },
  { name: "Amber", color: "#f59e0b" },
  { name: "Green", color: "#16a34a" },
  { name: "Blue", color: "#2563eb" },
  { name: "Purple", color: "#9333ea" },
  { name: "Pink", color: "#ec4899" },
  { name: "White", color: "#ffffff" },
];

// 이미지 크기 프리셋 - Tailwind 클래스 사용
const IMAGE_SIZE_PRESETS = [
  {
    id: "thumbnail",
    label: "썸네일",
    icon: Square,
    description: "매우 작게",
    className: "w-[150px] max-w-[150px] h-auto rounded-lg",
    detectClass: "w-[150px]",
  },
  {
    id: "mobile",
    label: "모바일",
    icon: Smartphone,
    description: "화면의 50%",
    className: "w-1/2 max-w-[50%] h-auto rounded-lg",
    detectClass: "w-1/2",
  },
  {
    id: "tablet",
    label: "태블릿",
    icon: Tablet,
    description: "화면의 75%",
    className: "w-3/4 max-w-[75%] h-auto rounded-lg",
    detectClass: "w-3/4",
  },
  {
    id: "full",
    label: "전체 너비",
    icon: Monitor,
    description: "화면에 꽉 차게",
    className: "w-full max-w-full h-auto rounded-lg",
    detectClass: "w-full",
  },
  {
    id: "original",
    label: "원본 크기",
    icon: Maximize,
    description: "원래 이미지 크기",
    className: "w-auto max-w-full h-auto rounded-lg",
    detectClass: "w-auto",
  },
];

const TipTapEditor = ({ content, onChange, placeholder }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // 이미지 리사이즈 관련 상태
  const [showImageSizeSheet, setShowImageSizeSheet] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageSize, setCurrentImageSize] = useState(null);
  const [isSheetClosing, setIsSheetClosing] = useState(false);

  const imageClickTimeoutRef = useRef(null);
  const bottomSheetRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline hover:text-blue-800",
        },
      }),
      Color,
      Placeholder.configure({
        placeholder: placeholder || "Write something amazing...",
      }),
      CustomImage,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    // 붙여넣기 이벤트 처리
    editorProps: {
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(
          (item) => item.type.indexOf("image") !== -1
        );

        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();

          if (file) {
            // FileReader를 사용하여 base64로 변환
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64String = e.target.result;

              // 이미지 크기 체크 (옵션)
              const sizeInBytes = Math.ceil((base64String.length - 22) * 0.75);
              const sizeInMB = sizeInBytes / (1024 * 1024);

              if (sizeInMB > 10) {
                alert(
                  `이미지 크기가 너무 큽니다 (${sizeInMB.toFixed(
                    1
                  )}MB). 10MB 이하의 이미지를 사용해주세요.`
                );
                return;
              }

              // 에디터에 base64 이미지 삽입 (기본 크기: 모바일, Tailwind 클래스 사용)
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "image",
                  attrs: {
                    src: base64String,
                    class: "w-1/2 max-w-[50%] h-auto rounded-lg",
                    "data-size": "mobile",
                  },
                })
                .run();
            };
            reader.readAsDataURL(file);
            return true;
          }
        }

        return false;
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFile = files.find((file) => file.type.startsWith("image/"));

        if (imageFile) {
          event.preventDefault();

          // FileReader를 사용하여 base64로 변환
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64String = e.target.result;

            // 이미지 크기 체크
            const sizeInBytes = Math.ceil((base64String.length - 22) * 0.75);
            const sizeInMB = sizeInBytes / (1024 * 1024);

            if (sizeInMB > 10) {
              alert(
                `이미지 크기가 너무 큽니다 (${sizeInMB.toFixed(
                  1
                )}MB). 10MB 이하의 이미지를 사용해주세요.`
              );
              return;
            }

            // 에디터에 base64 이미지 삽입 (기본 크기: 모바일, Tailwind 클래스 사용)
            editor
              .chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: {
                  src: base64String,
                  class: "w-1/2 max-w-[50%] h-auto rounded-lg",
                  "data-size": "mobile",
                },
              })
              .run();
          };
          reader.readAsDataURL(imageFile);
          return true;
        }

        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target;

        // 이미지 클릭 감지
        if (target.tagName === "IMG" && target.src) {
          event.preventDefault();
          event.stopPropagation();

          // 모바일에서 포커스 제거 (키보드 방지)
          if (editor) {
            editor.commands.blur();
            // 현재 selection 제거
            editor.commands.setTextSelection(0);
          }

          // contenteditable 임시 비활성화
          const editorElement = editor.view.dom;
          const originalContentEditable = editorElement.contentEditable;
          editorElement.contentEditable = "false";

          // 더블클릭 방지를 위한 디바운스
          if (imageClickTimeoutRef.current) {
            clearTimeout(imageClickTimeoutRef.current);
          }

          imageClickTimeoutRef.current = setTimeout(() => {
            setSelectedImage(target);

            // 현재 이미지 크기 감지 (클래스 기반)
            const imgClass = target.className || "";
            let currentPresetId = "mobile"; // 기본값

            // 클래스에서 현재 크기 찾기
            for (const preset of IMAGE_SIZE_PRESETS) {
              if (imgClass.includes(preset.detectClass)) {
                currentPresetId = preset.id;
                break;
              }
            }

            // data-size 속성도 확인 (폴백)
            const dataSize = target.getAttribute("data-size");
            if (dataSize) {
              currentPresetId = dataSize;
            }

            setCurrentImageSize(currentPresetId);
            setShowImageSizeSheet(true);

            // 바텀시트가 열린 후 contenteditable 복원
            setTimeout(() => {
              editorElement.contentEditable = originalContentEditable;
            }, 100);
          }, 200);

          return true; // 이벤트 처리 완료
        }
      },
    },
  });

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // 바텀시트 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showImageSizeSheet &&
        bottomSheetRef.current &&
        !bottomSheetRef.current.contains(e.target)
      ) {
        handleCloseImageSheet();
      }
    };

    if (showImageSizeSheet) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showImageSizeSheet]);

  // 바텀시트 닫기 핸들러
  const handleCloseImageSheet = useCallback(() => {
    setIsSheetClosing(true);

    // 바텀시트 닫을 때 에디터 포커스 복원 (데스크톱용)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    setTimeout(() => {
      setShowImageSizeSheet(false);
      setSelectedImage(null);
      setCurrentImageSize(null);
      setIsSheetClosing(false);

      // 데스크톱에서만 포커스 복원
      if (!isMobile && editor) {
        editor.commands.focus();
      }
    }, 300);
  }, [editor]);

  // 이미지 크기 적용 - Tailwind 클래스 사용
  const applyImageSize = useCallback(
    (preset) => {
      if (!selectedImage || !editor) return;

      // DOM 요소 직접 업데이트
      selectedImage.className = preset.className;
      selectedImage.setAttribute("data-size", preset.id);

      // TipTap 에디터 업데이트
      const { state } = editor;
      const { doc } = state;
      let imagePos = null;

      // 이미지 노드 찾기
      doc.descendants((node, pos) => {
        if (
          node.type.name === "image" &&
          node.attrs.src === selectedImage.src
        ) {
          imagePos = pos;
          return false;
        }
      });

      if (imagePos !== null) {
        // 트랜잭션으로 속성 업데이트
        editor
          .chain()
          .focus()
          .updateAttributes("image", {
            class: preset.className,
            "data-size": preset.id,
          })
          .run();
      }

      // HTML 직접 가져오기
      const updatedHtml = editor.getHTML();
      onChange(updatedHtml);

      // 바텀시트 닫기
      handleCloseImageSheet();
    },
    [selectedImage, editor, onChange, handleCloseImageSheet]
  );

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setShowLinkModal(false);
      setLinkUrl("");
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        // FileReader를 사용하여 base64로 변환
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target.result;

          // 이미지 크기 체크
          const sizeInBytes = Math.ceil((base64String.length - 22) * 0.75);
          const sizeInMB = sizeInBytes / (1024 * 1024);

          if (sizeInMB > 10) {
            alert(
              `이미지 크기가 너무 큽니다 (${sizeInMB.toFixed(
                1
              )}MB). 10MB 이하의 이미지를 사용해주세요.`
            );
            return;
          }

          // 에디터에 base64 이미지 삽입 (기본 크기: 모바일, Tailwind 클래스 사용)
          editor
            .chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: {
                src: base64String,
                class: "w-1/2 max-w-[50%] h-auto rounded-lg",
                "data-size": "mobile",
              },
            })
            .run();
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  }, [editor]);

  const setColor = useCallback(
    (color) => {
      if (color === null) {
        editor.chain().focus().unsetColor().run();
      } else {
        editor.chain().focus().setColor(color).run();
      }
      setShowColorPicker(false);
    },
    [editor]
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor flex flex-col h-full min-h-0 border border-stone-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="editor-toolbar flex items-center flex-wrap gap-1 p-2 border-b border-stone-200 bg-stone-50 flex-shrink-0">
        {/* Text Style */}
        <div className="flex items-center">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </MenuButton>

          <Divider />

          {/* Color Picker Button */}
          <div className="relative">
            <MenuButton
              onClick={() => setShowColorPicker(!showColorPicker)}
              isActive={showColorPicker}
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
            </MenuButton>

            {/* Color Picker Dropdown */}
            {showColorPicker && (
              <div className="absolute w-[100px] top-full left-0 mt-1 p-2 bg-white border border-stone-200 rounded-lg shadow-lg z-10">
                <div className="grid grid-cols-3 gap-1">
                  {COLORS.map((colorOption) => (
                    <button
                      key={colorOption.name}
                      type="button"
                      onClick={() => setColor(colorOption.color)}
                      className={`w-6 h-6 rounded border-2 transition-all ${
                        colorOption.color === "#ffffff"
                          ? "border-stone-300 bg-white hover:border-stone-400"
                          : "border-transparent hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: colorOption.color || "white",
                      }}
                      title={colorOption.name}
                    >
                      {colorOption.name === "Default" && (
                        <span className="text-xs text-white">A</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <MenuButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <Divider />

        {/* Headings */}
        <div className="flex items-center">
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive("heading", { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive("heading", { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive("heading", { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        <Divider />

        {/* Lists */}
        <div className="flex items-center">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
        </div>

        <Divider />

        {/* Links & Images */}
        <div className="flex items-center">
          <MenuButton
            onClick={() => setShowLinkModal(true)}
            isActive={editor.isActive("link")}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
          {editor.isActive("link") && (
            <MenuButton onClick={removeLink} title="Remove Link">
              <Unlink className="w-4 h-4" />
            </MenuButton>
          )}
          <MenuButton onClick={addImage} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        <Divider />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto prose" />

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLinkModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLink}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Size Bottom Sheet */}
      {showImageSizeSheet && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 ${
              isSheetClosing ? "animate-fadeOut" : "animate-fadeIn"
            }`}
            onClick={handleCloseImageSheet}
            onTouchStart={(e) => e.stopPropagation()} // 모바일 터치 이벤트 차단
          />

          {/* Bottom Sheet */}
          <div
            ref={bottomSheetRef}
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl ${
              isSheetClosing
                ? "animate-image-sheet-slideDown"
                : "animate-image-sheet-slideUp"
            }`}
            style={{ maxHeight: "70vh" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-stone-100">
              <h3 className="text-lg font-semibold text-stone-900">
                이미지 크기 선택
              </h3>
              <button
                type="button"
                onClick={handleCloseImageSheet}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Size Options */}
            <div
              className="p-4 space-y-2 overflow-y-auto"
              style={{ maxHeight: "calc(70vh - 100px)" }}
            >
              {IMAGE_SIZE_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = currentImageSize === preset.id;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyImageSize(preset)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                      isSelected
                        ? "bg-stone-100 border-2 border-stone-900"
                        : "bg-white border-2 border-stone-200 hover:bg-stone-50 active:bg-stone-100"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? "bg-stone-900 text-white"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div
                          className={`font-medium ${
                            isSelected ? "text-stone-900" : "text-stone-700"
                          }`}
                        >
                          {preset.label}
                        </div>
                        <div className="text-sm text-stone-500">
                          {preset.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Visual Preview with Tailwind classes */}
            <div className="px-6 pb-6 pt-2">
              <div className="p-3 bg-stone-50 rounded-lg">
                <div className="text-xs text-stone-500 mb-2">미리보기</div>
                <div className="flex justify-center">
                  <div
                    className={`bg-stone-200 rounded transition-all duration-300 ${
                      currentImageSize === "thumbnail"
                        ? "w-[60px]"
                        : currentImageSize === "mobile"
                        ? "w-[120px]"
                        : currentImageSize === "tablet"
                        ? "w-[180px]"
                        : currentImageSize === "full"
                        ? "w-[240px]"
                        : "w-[150px]"
                    } h-10`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close color picker */}
      {showColorPicker && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default TipTapEditor;
