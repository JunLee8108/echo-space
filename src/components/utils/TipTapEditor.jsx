import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Bold,
  Underline as UnderlineIcon,
  Strikethrough,
  Quote,
  Image as ImageIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Palette,
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

const TipTapEditor = ({ content, onChange, placeholder }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Color,
      Placeholder.configure({
        placeholder: placeholder || "Write something amazing...",
      }),
      Image.configure({
        inline: true,
        allowBase64: true, // Base64 허용
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
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

              // 에디터에 base64 이미지 삽입
              editor.chain().setImage({ src: base64String }).run();
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

            // 에디터에 base64 이미지 삽입
            editor.chain().setImage({ src: base64String }).run();
          };
          reader.readAsDataURL(imageFile);
          return true;
        }

        return false;
      },
    },
  });

  // content prop이 변경될 때 에디터 내용 업데이트
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

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

          // 에디터에 base64 이미지 삽입
          editor.chain().setImage({ src: base64String }).run();
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

        {/* Images */}
        <div className="flex items-center">
          <MenuButton onClick={addImage} title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto prose" />

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
