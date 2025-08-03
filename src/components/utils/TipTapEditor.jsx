import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
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
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      Image.configure({
        inline: true,
        allowBase64: true,
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
  });

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
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
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
