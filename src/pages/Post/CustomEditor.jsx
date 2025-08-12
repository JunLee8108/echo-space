// components/CustomEditor/CustomEditor.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Calendar,
  Clock,
  Image as ImageIcon,
  Hash,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
} from "lucide-react";
import "./CustomEditor.css";

import { useUserLanguage } from "../../stores/userStore";
import { createTranslator } from "../../components/utils/translations";

// 이모지 컬렉션
const EMOJI_CATEGORIES = {
  emotions: {
    name: "Emotions",
    emojis: [
      "😀",
      "😊",
      "😂",
      "🥰",
      "😎",
      "😢",
      "😭",
      "😡",
      "😤",
      "😴",
      "🤔",
      "😌",
    ],
  },
  activities: {
    name: "Activities",
    emojis: [
      "☕",
      "🍽️",
      "🏃",
      "🚶",
      "🛌",
      "📚",
      "💻",
      "🎮",
      "🎵",
      "🎬",
      "✈️",
      "🏠",
    ],
  },
  weather: {
    name: "Weather",
    emojis: [
      "☀️",
      "⛅",
      "☁️",
      "🌧️",
      "⛈️",
      "🌈",
      "❄️",
      "🌸",
      "🍂",
      "🌙",
      "⭐",
      "🌅",
    ],
  },
  symbols: {
    name: "Symbols",
    emojis: [
      "❤️",
      "💔",
      "✨",
      "🔥",
      "💯",
      "✅",
      "❌",
      "⚡",
      "💫",
      "🎯",
      "💡",
      "🎉",
    ],
  },
};

const CustomEditor = ({ content, onChange }) => {
  const language = useUserLanguage();
  const translate = createTranslator(language);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] =
    useState("emotions");
  const [currentAlignment, setCurrentAlignment] = useState("left");
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    color: null,
  });
  const [selectedColor, setSelectedColor] = useState("#000000");
  const dragCounterRef = useRef(0);

  // 초기 콘텐츠 설정
  useEffect(() => {
    if (
      editorRef.current &&
      content !== undefined &&
      content !== editorRef.current.innerHTML
    ) {
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  // 활성 스타일 체크 (개선된 버전)
  const checkActiveStyles = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // 현재 커서 위치의 스타일 체크
    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    // 색상 체크 - computed style 사용
    let currentColor = null;
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;

      // RGB를 HEX로 변환
      if (color.startsWith("rgb")) {
        const matches = color.match(/\d+/g);
        if (matches) {
          const r = parseInt(matches[0]);
          const g = parseInt(matches[1]);
          const b = parseInt(matches[2]);
          currentColor =
            "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
      }
    }

    const newStyles = {
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      color: currentColor,
    };

    setActiveStyles(newStyles);

    const editorText = editorRef.current?.innerText?.trim();
    if (!editorText || editorText.length === 0) {
      return; // 빈 에디터일 때는 선택된 색상 유지
    }

    // 현재 활성 색상 업데이트
    if (currentColor) {
      // 표준 색상과 비교
      if (
        currentColor.toLowerCase() === "#000000" ||
        currentColor.toLowerCase() === "#44403c"
      ) {
        setSelectedColor("#000000");
      } else if (currentColor.toLowerCase() === "#dc2626") {
        setSelectedColor("#dc2626");
      } else if (currentColor.toLowerCase() === "#2563eb") {
        setSelectedColor("#2563eb");
      } else if (currentColor.toLowerCase() === "#16a34a") {
        setSelectedColor("#16a34a");
      } else {
        setSelectedColor(null);
      }
    } else {
      setSelectedColor(null);
    }
  }, []);

  // 리스트 변환 함수 (개선된 버전)
  const convertToList = (type) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    // 텍스트 노드의 부모 요소 찾기
    let targetNode =
      container.nodeType === Node.TEXT_NODE
        ? container
        : container.childNodes[range.startOffset];

    if (!targetNode) return;

    // 텍스트 노드가 아니면 첫 번째 텍스트 노드 찾기
    if (targetNode.nodeType !== Node.TEXT_NODE) {
      const textNodes = [];
      const walker = document.createTreeWalker(
        targetNode,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }
      if (textNodes.length > 0) {
        targetNode = textNodes[0];
      }
    }

    // 현재 텍스트 내용
    const currentText = targetNode.textContent || "";

    // 리스트 생성
    const listType = type === "ordered" ? "ol" : "ul";
    const list = document.createElement(listType);
    const listItem = document.createElement("li");

    // 남은 텍스트 추가
    listItem.textContent = currentText;
    list.appendChild(listItem);

    // DOM에 삽입
    if (targetNode.parentNode === editorRef.current) {
      // 에디터 직접 자식인 경우
      editorRef.current.insertBefore(list, targetNode);
      editorRef.current.removeChild(targetNode);
    } else if (targetNode.parentNode) {
      // 다른 요소의 자식인 경우
      const parent = targetNode.parentNode;

      // P 태그나 DIV 태그인 경우
      if (parent.tagName === "P" || parent.tagName === "DIV") {
        parent.parentNode.insertBefore(list, parent);
        parent.parentNode.removeChild(parent);
      } else {
        // 기타 경우 텍스트 노드만 교체
        parent.insertBefore(list, targetNode);
        parent.removeChild(targetNode);
      }
    }

    // 커서를 리스트 아이템 끝으로 이동
    const newRange = document.createRange();
    newRange.selectNodeContents(listItem);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // 변경사항 알림
    handleInput();
  };

  // 콘텐츠 변경 감지 및 해시태그 추출 (리스트 변환 제거)
  const handleInput = useCallback(() => {
    const html = editorRef.current.innerHTML;
    onChange(html);
    checkActiveStyles();
  }, [onChange, checkActiveStyles]);

  // beforeinput 이벤트 핸들러 (개선된 버전)
  const handleBeforeInput = useCallback((e) => {
    if (e.inputType === "insertText" && e.data === " ") {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const container = range.startContainer;

      if (container.nodeType !== Node.TEXT_NODE) return;

      const text = container.textContent;
      const offset = range.startOffset;

      // 현재 위치까지의 텍스트
      const textBefore = text.substring(0, offset);

      // 패턴 매칭을 위한 텍스트 (앞 공백 제거)
      const trimmedText = textBefore.trimStart();

      // '- ' 패턴 체크
      if (trimmedText === "-") {
        e.preventDefault();

        // '-' 텍스트 제거
        const remainingText = text.substring(offset).trim();
        container.textContent = remainingText;

        // 리스트로 변환
        convertToList("unordered");
        return false;
      }

      // '1. ' 등의 숫자 패턴 체크
      if (/^\d+\.$/.test(trimmedText)) {
        e.preventDefault();

        // '1.' 텍스트 제거
        const remainingText = text.substring(offset).trim();
        container.textContent = remainingText;

        // 리스트로 변환
        convertToList("ordered");
        return false;
      }
    }
  }, []);

  // 키 입력 감지 (해시태그 완성 체크 및 색상 업데이트)
  const handleKeyUp = useCallback(
    (e) => {
      if (e.key === " " || e.key === "Enter") {
        handleInput();
      }
      // Backspace나 화살표 키 등으로 이동할 때도 스타일 체크
      if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key.startsWith("Arrow") ||
        e.key === "Home" ||
        e.key === "End"
      ) {
        setTimeout(() => checkActiveStyles(), 0);
      }
      checkActiveStyles();
    },
    [handleInput, checkActiveStyles]
  );

  // Selection 변경 감지
  useEffect(() => {
    const handleSelectionChange = () => {
      if (
        editorRef.current &&
        editorRef.current.contains(document.activeElement)
      ) {
        checkActiveStyles();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [checkActiveStyles]);

  // 명령 실행 헬퍼
  const execCommand = (command, value = null) => {
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
    checkActiveStyles();
  };

  // 텍스트 스타일 토글
  const toggleStyle = (style) => {
    execCommand(style);
  };

  // 색상 변경
  const changeColor = (color) => {
    execCommand("foreColor", color);
    setSelectedColor(color);
  };

  // 정렬 변경
  const changeAlignment = (align) => {
    const alignCommand =
      align === "left"
        ? "justifyLeft"
        : align === "center"
        ? "justifyCenter"
        : "justifyRight";
    execCommand(alignCommand);
    setCurrentAlignment(align);
  };

  // 날짜 삽입 (영어)
  const insertDate = () => {
    const date = new Date();
    let formattedDate;

    if (language === "Korean") {
      // 한국어 형식: 2024년 12월 19일 목요일
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekdays = [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
      ];
      const weekday = weekdays[date.getDay()];
      formattedDate = `${year}년 ${month}월 ${day}일 ${weekday}`;
    } else if (language === "English") {
      // 영어 형식 (기존)
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }

    insertAtCursor(formattedDate);
  };

  // 시간 삽입 (영어)
  const insertTime = () => {
    const time = new Date();
    let formattedTime;

    if (language === "Korean") {
      // 한국어 형식: 오후 3시 30분
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const period = hours >= 12 ? "오후" : "오전";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      formattedTime = `${period} ${displayHours}시 ${minutes}분`;
    } else {
      // 영어 형식 (기존)
      formattedTime = time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    insertAtCursor(formattedTime);
  };

  // 커서 위치에 텍스트 삽입
  const insertAtCursor = (text) => {
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput();
  };

  // HTML 삽입 (수정된 버전)
  const insertHTML = (html, maintainFocus = true) => {
    // 에디터에 포커스
    editorRef.current.focus();

    // HTML 삽입
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // HTML 문자열을 DOM 요소로 변환
      const temp = document.createElement("div");
      temp.innerHTML = html;

      // 모든 자식 요소를 삽입
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }

      range.insertNode(fragment);

      // 커서를 삽입된 내용 뒤로 이동
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // 선택 영역이 없으면 끝에 추가
      editorRef.current.innerHTML += html;
    }

    // 변경사항 알림
    handleInput();

    // 포커스 제어
    if (!maintainFocus) {
      setTimeout(() => {
        editorRef.current.blur();
      }, 10);
    }
  };

  // 이모지 삽입
  const insertEmoji = (emoji) => {
    insertAtCursor(emoji + " ");
    setShowEmojiPicker(false);
    setShowCategoryDropdown(false);
  };

  // 이미지 업로드 (수정된 버전)
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // 이미지 파일만 필터링
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert("Please select image files.");
      return;
    }

    // 각 이미지 처리
    imageFiles.forEach((file, index) => {
      processImageFile(file, index === imageFiles.length - 1);
    });

    e.target.value = "";
  };

  // 이미지 파일 처리 (수정된 버전)
  const processImageFile = (file, isLastFile = true) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;

      // 이미지 크기 체크
      const sizeInBytes = Math.ceil((base64String.length - 22) * 0.75);
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 10) {
        alert(
          `Image size is too large (${sizeInMB.toFixed(
            1
          )}MB). Please use an image under 10MB.`
        );
        return;
      }

      // 이미지 HTML 생성
      const imgHTML = `<img src="${base64String}" class="editor-image" style="max-width: 100%; height: auto; display: block; margin: 1em 0;" />`;

      // 에디터가 비어있으면 직접 삽입
      if (
        !editorRef.current.innerHTML ||
        editorRef.current.innerHTML === "<br>"
      ) {
        editorRef.current.innerHTML = imgHTML;
        handleInput();
      } else {
        // 기존 내용이 있으면 현재 위치에 삽입
        insertHTML(imgHTML, false);
      }

      // 마지막 파일이 아니면 줄바꿈 추가
      if (!isLastFile) {
        insertHTML("<br>", false);
      }
    };
    reader.readAsDataURL(file);
  };

  // 드래그 앤 드롭 이벤트 처리
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) {
      editorRef.current.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      editorRef.current.classList.remove("drag-over");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드래그 앤 드롭 처리 (수정된 버전)
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    editorRef.current.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    // 드롭 위치에 커서 설정
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // 여러 이미지 처리
    imageFiles.forEach((file, index) => {
      processImageFile(file, index === imageFiles.length - 1);
    });
  };

  // 붙여넣기 이벤트 처리 (수정된 버전)
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.indexOf("image") !== -1);

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();

      if (file) {
        // 현재 커서 위치에 이미지 삽입
        processImageFile(file, true);
      }
    }
  };

  // 키보드 단축키
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          toggleStyle("bold");
          break;
        case "i":
          e.preventDefault();
          toggleStyle("italic");
          break;
        case "u":
          e.preventDefault();
          toggleStyle("underline");
          break;
      }
    }
  };

  // 링크 자동 인식
  useEffect(() => {
    if (!editorRef.current) return;

    const handleAutoLink = () => {
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const urlRegex = /(?:^|\s)(https?:\/\/[^\s]+)(?:\s|$)/g;
      const nodesToReplace = [];

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent;
        const matches = [...text.matchAll(urlRegex)];

        if (matches.length > 0 && node.parentElement?.tagName !== "A") {
          nodesToReplace.push({ node, matches });
        }
      }

      nodesToReplace.forEach(({ node, matches }) => {
        let lastIndex = 0;
        const fragment = document.createDocumentFragment();

        matches.forEach((match) => {
          const url = match[1];
          const index = match.index + match[0].indexOf(url);

          if (index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(node.textContent.slice(lastIndex, index))
            );
          }

          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.className = "editor-link";
          link.textContent = url;
          fragment.appendChild(link);

          lastIndex = index + url.length;
        });

        if (lastIndex < node.textContent.length) {
          fragment.appendChild(
            document.createTextNode(node.textContent.slice(lastIndex))
          );
        }

        node.parentNode.replaceChild(fragment, node);
      });
    };

    const debounce = setTimeout(handleAutoLink, 1000);
    return () => clearTimeout(debounce);
  }, [content]);

  // 모달 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showEmojiPicker && !e.target.closest(".emoji-picker-container")) {
        setShowEmojiPicker(false);
        setShowCategoryDropdown(false);
      }
      if (
        showCategoryDropdown &&
        !e.target.closest(".emoji-category-dropdown")
      ) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker, showCategoryDropdown]);

  // beforeinput 이벤트 리스너 추가
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener("beforeinput", handleBeforeInput);
      return () => {
        editor.removeEventListener("beforeinput", handleBeforeInput);
      };
    }
  }, [handleBeforeInput]);

  return (
    <div className="custom-editor">
      {/* 툴바 */}
      <div className="editor-toolbar">
        {/* 첫 번째 줄 - 텍스트 스타일 */}
        <div className="toolbar-row">
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => toggleStyle("bold")}
              className={`toolbar-btn ${activeStyles.bold ? "active" : ""}`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleStyle("italic")}
              className={`toolbar-btn ${activeStyles.italic ? "active" : ""}`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleStyle("underline")}
              className={`toolbar-btn ${
                activeStyles.underline ? "active" : ""
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* 정렬 */}
          <div className="toolbar-group">
            <button
              type="button"
              onClick={() => changeAlignment("left")}
              className={`toolbar-btn ${
                currentAlignment === "left" ? "active" : ""
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => changeAlignment("center")}
              className={`toolbar-btn ${
                currentAlignment === "center" ? "active" : ""
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => changeAlignment("right")}
              className={`toolbar-btn ${
                currentAlignment === "right" ? "active" : ""
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="toolbar-divider" />

          {/* 색상 선택 */}
          <div className="toolbar-group space-x-0.5">
            <button
              type="button"
              onClick={() => changeColor("#000000")}
              className={`color-btn bg-black ${
                selectedColor === "#000000" ? "active" : ""
              }`}
              title="Black"
            />
            <button
              type="button"
              onClick={() => changeColor("#dc2626")}
              className={`color-btn bg-red-600 ${
                selectedColor === "#dc2626" ? "active" : ""
              }`}
              title="Red"
            />
            <button
              type="button"
              onClick={() => changeColor("#2563eb")}
              className={`color-btn bg-blue-600 ${
                selectedColor === "#2563eb" ? "active" : ""
              }`}
              title="Blue"
            />
            <button
              type="button"
              onClick={() => changeColor("#16a34a")}
              className={`color-btn bg-green-600 ${
                selectedColor === "#16a34a" ? "active" : ""
              }`}
              title="Green"
            />
          </div>
        </div>

        {/* 두 번째 줄 - 빠른 입력 도구 */}
        <div className="toolbar-row">
          <button
            type="button"
            onClick={insertDate}
            className="quick-btn"
            title={translate("editor.tooltip.insertDate")}
          >
            <Calendar className="w-3 h-3" />
            {translate("editor.button.date")}
          </button>

          <button
            type="button"
            onClick={insertTime}
            className="quick-btn"
            title={translate("editor.tooltip.insertTime")}
          >
            <Clock className="w-3 h-3" />
            {translate("editor.button.time")}
          </button>

          <div className="emoji-picker-container">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="quick-btn"
              title={translate("editor.tooltip.insertEmoji")}
            >
              <Smile className="w-3 h-3" />
              {translate("editor.button.emoji")}
            </button>

            {showEmojiPicker && (
              <div className="emoji-picker">
                <div className="emoji-header">
                  <div className="emoji-category-dropdown">
                    <button
                      type="button"
                      className="category-dropdown-btn"
                      onClick={() =>
                        setShowCategoryDropdown(!showCategoryDropdown)
                      }
                    >
                      <span className="category-icon">
                        {selectedEmojiCategory === "emotions" && "😊"}
                        {selectedEmojiCategory === "activities" && "⚡"}
                        {selectedEmojiCategory === "weather" && "☀️"}
                        {selectedEmojiCategory === "symbols" && "❤️"}
                      </span>
                      <span className="category-name">
                        {EMOJI_CATEGORIES[selectedEmojiCategory].name}
                      </span>
                      <ChevronDown
                        className={`dropdown-arrow ${
                          showCategoryDropdown ? "rotate" : ""
                        }`}
                      />
                    </button>

                    {showCategoryDropdown && (
                      <div className="category-dropdown-menu">
                        {Object.entries(EMOJI_CATEGORIES).map(
                          ([key, category]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSelectedEmojiCategory(key);
                                setShowCategoryDropdown(false);
                              }}
                              className={`category-dropdown-item ${
                                selectedEmojiCategory === key ? "active" : ""
                              }`}
                            >
                              <span className="category-item-icon">
                                {key === "emotions" && "😊"}
                                {key === "activities" && "⚡"}
                                {key === "weather" && "☀️"}
                                {key === "symbols" && "❤️"}
                              </span>
                              <span className="category-item-name">
                                {category.name}
                              </span>
                              {selectedEmojiCategory === key && (
                                <span className="category-item-check">✓</span>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="emoji-grid-small">
                  {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map(
                    (emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="emoji-btn"
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="quick-btn"
            title={translate("editor.tooltip.addImage")}
          >
            <ImageIcon className="w-3 h-3" />
            {translate("editor.button.image")}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* 에디터 본문 */}
      <div
        ref={editorRef}
        contentEditable
        className="editor-content"
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseUp={checkActiveStyles}
        onClick={checkActiveStyles}
        data-placeholder={"Share your story..."}
      />
    </div>
  );
};

export default CustomEditor;
