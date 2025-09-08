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
import { searchHashtags } from "../../services/hashtagService";

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

const CustomEditor = ({ content, onChange, onHashtagAdd }) => {
  const language = useUserLanguage();
  const translate = createTranslator(language);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentAlignment, setCurrentAlignment] = useState("left");
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    color: null,
  });
  const [selectedColor, setSelectedColor] = useState("#000000");
  const dragCounterRef = useRef(0);

  // 해시태그 자동완성 관련 state
  const [isTypingHashtag, setIsTypingHashtag] = useState(false);
  const [currentHashtagText, setCurrentHashtagText] = useState("");
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });

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

  // 해시태그 자동완성 검색
  useEffect(() => {
    console.log("Current hashtag text:", currentHashtagText);

    if (!currentHashtagText || currentHashtagText.length < 1) {
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        const suggestions = await searchHashtags(currentHashtagText);
        console.log("Suggestions:", suggestions);
        setHashtagSuggestions(suggestions);
        setShowHashtagSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("해시태그 검색 실패:", error);
        setHashtagSuggestions([]);
        setShowHashtagSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(searchTimer);
  }, [currentHashtagText]);

  // 활성 스타일 체크
  const checkActiveStyles = useCallback(() => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    let element = selection.anchorNode;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }

    let currentColor = null;
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;

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
      return;
    }

    if (currentColor) {
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

  // 리스트 변환 함수
  const convertToList = (type) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const container = range.startContainer;

    let targetNode =
      container.nodeType === Node.TEXT_NODE
        ? container
        : container.childNodes[range.startOffset];

    if (!targetNode) return;

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

    const currentText = targetNode.textContent || "";

    const listType = type === "ordered" ? "ol" : "ul";
    const list = document.createElement(listType);
    const listItem = document.createElement("li");

    listItem.textContent = currentText;
    list.appendChild(listItem);

    if (targetNode.parentNode === editorRef.current) {
      editorRef.current.insertBefore(list, targetNode);
      editorRef.current.removeChild(targetNode);
    } else if (targetNode.parentNode) {
      const parent = targetNode.parentNode;

      if (parent.tagName === "P" || parent.tagName === "DIV") {
        parent.parentNode.insertBefore(list, parent);
        parent.parentNode.removeChild(parent);
      } else {
        parent.insertBefore(list, targetNode);
        parent.removeChild(targetNode);
      }
    }

    const newRange = document.createRange();
    newRange.selectNodeContents(listItem);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);

    handleInput();
  };

  // 해시태그 확정
  const confirmHashtag = (hashtag) => {
    setShowHashtagSuggestions(false);

    if (onHashtagAdd) {
      onHashtagAdd(hashtag.toLowerCase());
    }

    setTimeout(() => {
      removeHashtagText();
      resetHashtagMode();
    }, 50);
  };

  const handleCompositionEnd = () => {
    if (isTypingHashtag) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const container = range.startContainer;

          if (container.nodeType === Node.TEXT_NODE) {
            const text = container.textContent;
            const offset = range.startOffset;

            let hashIndex = -1;
            for (let i = offset - 1; i >= 0; i--) {
              if (text[i] === "#") {
                hashIndex = i;
                break;
              }
              if (text[i] === " " || text[i] === "\n") {
                break;
              }
            }

            if (hashIndex !== -1) {
              const hashtagText = text.substring(hashIndex + 1, offset);
              setCurrentHashtagText(hashtagText);
            }
          }
        }
      }, 0);
    }
  };

  // 해시태그 텍스트 제거
  const removeHashtagText = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.startContainer;

      if (container.nodeType === Node.TEXT_NODE) {
        const text = container.textContent;
        const offset = range.startOffset;

        let hashIndex = -1;
        for (let i = offset - 1; i >= 0; i--) {
          if (text[i] === "#") {
            hashIndex = i;
            break;
          }
          if (text[i] === " " || text[i] === "\n") {
            break;
          }
        }

        if (hashIndex !== -1) {
          const beforeHash = text.slice(0, hashIndex);
          const afterHash = text.slice(offset);

          container.textContent = beforeHash + afterHash;

          const newRange = document.createRange();
          newRange.setStart(container, hashIndex);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }

    if (editorRef.current) {
      const event = new Event("input", { bubbles: true });
      editorRef.current.dispatchEvent(event);
    }
  };

  // 해시태그 모드 취소
  const cancelHashtagMode = () => {
    resetHashtagMode();
  };

  // 해시태그 모드 리셋
  const resetHashtagMode = () => {
    setIsTypingHashtag(false);
    setCurrentHashtagText("");
    setShowHashtagSuggestions(false);
    setHashtagSuggestions([]);
    setSelectedSuggestionIndex(0);
    setSuggestionPosition({ top: 0, left: 0 });
  };

  // 제안 항목 선택
  const selectSuggestion = (suggestion) => {
    setShowHashtagSuggestions(false);
    confirmHashtag(suggestion.name);
  };

  // 콘텐츠 변경 감지
  const handleInput = useCallback(() => {
    const html = editorRef.current.innerHTML;
    onChange(html);
    checkActiveStyles();

    if (isTypingHashtag) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.startContainer;

        if (container.nodeType === Node.TEXT_NODE) {
          const text = container.textContent;
          const offset = range.startOffset;

          let hashIndex = -1;
          for (let i = offset - 1; i >= 0; i--) {
            if (text[i] === "#") {
              hashIndex = i;
              break;
            }
            if (text[i] === " " || text[i] === "\n") {
              break;
            }
          }

          if (hashIndex !== -1) {
            const hashtagText = text.substring(hashIndex + 1, offset);
            setCurrentHashtagText(hashtagText);
            updateSuggestionPosition();
          }
        }
      }
    }
  }, [onChange, checkActiveStyles, isTypingHashtag]);

  const updateSuggestionPosition = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();

      let top = rect.bottom - editorRect.top + editorRef.current.scrollTop + 5;
      let left = rect.left - editorRect.left + editorRef.current.scrollLeft;

      const windowHeight = window.innerHeight;
      const suggestionHeight = 200;

      if (rect.bottom + suggestionHeight > windowHeight) {
        top =
          rect.top -
          editorRect.top +
          editorRef.current.scrollTop -
          suggestionHeight -
          5;
      }

      const windowWidth = window.innerWidth;
      const suggestionWidth = 200;

      if (rect.left + suggestionWidth > windowWidth) {
        left = Math.max(0, windowWidth - suggestionWidth - 20);
      }

      setSuggestionPosition({ top, left });
    }
  };

  // beforeinput 이벤트 핸들러 (Space 관련 로직 제거)
  const handleBeforeInput = useCallback(
    (e) => {
      // # 입력 감지
      if (e.data === "#" && !isTypingHashtag) {
        setIsTypingHashtag(true);
        setCurrentHashtagText("");
        setSelectedSuggestionIndex(0);

        setTimeout(() => {
          updateSuggestionPosition();
        }, 0);

        return;
      }

      // 해시태그 입력 중 스페이스 처리 - 해시태그 모드 취소
      if (isTypingHashtag && e.data === " ") {
        e.preventDefault();
        cancelHashtagMode();
        return;
      }

      // 리스트 변환 로직은 해시태그 모드가 아닐 때만
      if (!isTypingHashtag) {
        if (e.inputType === "insertText" && e.data === " ") {
          const selection = window.getSelection();
          if (!selection.rangeCount) return;

          const range = selection.getRangeAt(0);
          const container = range.startContainer;

          if (container.nodeType !== Node.TEXT_NODE) return;

          const text = container.textContent;
          const offset = range.startOffset;
          const textBefore = text.substring(0, offset);
          const trimmedText = textBefore.trimStart();

          if (trimmedText === "-") {
            e.preventDefault();
            const remainingText = text.substring(offset).trim();
            container.textContent = remainingText;
            convertToList("unordered");
            return false;
          }

          if (/^\d+\.$/.test(trimmedText)) {
            e.preventDefault();
            const remainingText = text.substring(offset).trim();
            container.textContent = remainingText;
            convertToList("ordered");
            return false;
          }
        }
      }
    },
    [isTypingHashtag]
  );

  // 키 입력 감지
  const handleKeyUp = useCallback(
    (e) => {
      if (e.key === " " || e.key === "Enter") {
        handleInput();
      }
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

  // 날짜 삽입
  const insertDate = () => {
    const date = new Date();
    let formattedDate;

    if (language === "Korean") {
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
      formattedDate = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }

    insertAtCursor(formattedDate);
  };

  // 시간 삽입
  const insertTime = () => {
    const time = new Date();
    let formattedTime;

    if (language === "Korean") {
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const period = hours >= 12 ? "오후" : "오전";
      const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
      formattedTime = `${period} ${displayHours}시 ${minutes}분`;
    } else {
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

  // HTML 삽입
  const insertHTML = (html, maintainFocus = true) => {
    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      const temp = document.createElement("div");
      temp.innerHTML = html;

      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }

      range.insertNode(fragment);

      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += html;
    }

    handleInput();

    if (!maintainFocus) {
      setTimeout(() => {
        editorRef.current.blur();
      }, 10);
    }
  };

  // 이미지 업로드
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert("Please select image files.");
      return;
    }

    imageFiles.forEach((file, index) => {
      processImageFile(file, index === imageFiles.length - 1);
    });

    e.target.value = "";
  };

  // 이미지 파일 처리
  const processImageFile = (file, isLastFile = true) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;

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

      const imgHTML = `<img src="${base64String}" class="editor-image" style="max-width: 100%; height: auto; display: block; margin: 1em 0;" />`;

      if (
        !editorRef.current.innerHTML ||
        editorRef.current.innerHTML === "<br>"
      ) {
        editorRef.current.innerHTML = imgHTML;
        handleInput();
      } else {
        insertHTML(imgHTML, false);
      }

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

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    editorRef.current.classList.remove("drag-over");

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }

    imageFiles.forEach((file, index) => {
      processImageFile(file, index === imageFiles.length - 1);
    });
  };

  // 붙여넣기 이벤트 처리
  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.indexOf("image") !== -1);

    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();

      if (file) {
        processImageFile(file, true);
      }
    }
  };

  // 키보드 단축키 (Space 처리 제거)
  const handleKeyDown = (e) => {
    // 해시태그 입력 중 엔터 처리
    if (isTypingHashtag) {
      // 제안 목록이 열려있고 엔터를 눌렀을 때
      if (
        e.key === "Enter" &&
        showHashtagSuggestions &&
        hashtagSuggestions.length > 0
      ) {
        e.preventDefault();

        const isComposing = e.nativeEvent.isComposing;

        if (!isComposing) {
          if (hashtagSuggestions[selectedSuggestionIndex]) {
            selectSuggestion(hashtagSuggestions[selectedSuggestionIndex]);
          }
        }
        return;
      }

      // 엔터키로 해시태그 추가
      if (e.key === "Enter") {
        e.preventDefault();

        const isComposing = e.nativeEvent.isComposing;

        if (!isComposing) {
          if (currentHashtagText.trim()) {
            confirmHashtag(currentHashtagText.trim());
          } else {
            cancelHashtagMode();
          }
        }
        return;
      }

      // ESC로 취소
      if (e.key === "Escape") {
        e.preventDefault();
        cancelHashtagMode();
        return;
      }

      // 백스페이스 처리
      if (e.key === "Backspace") {
        if (currentHashtagText.length === 0) {
          setTimeout(() => cancelHashtagMode(), 0);
        }
      }

      // 화살표 키로 제안 목록 네비게이션
      if (showHashtagSuggestions && hashtagSuggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < hashtagSuggestions.length - 1 ? prev + 1 : 0
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : hashtagSuggestions.length - 1
          );
          return;
        }
      }
    }

    // 기존 단축키 로직
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
    <div className="custom-editor" style={{ position: "relative" }}>
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
        onCompositionEnd={handleCompositionEnd}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onMouseUp={checkActiveStyles}
        onClick={checkActiveStyles}
        data-placeholder={"Share your story..."}
      ></div>

      {/* 해시태그 자동완성 - 동적 위치 */}
      {showHashtagSuggestions && (
        <div
          className="absolute z-50 bg-white border border-stone-200 rounded-lg shadow-lg max-w-xs"
          style={{
            top: `${suggestionPosition.top + 50}px`,
            left: `${suggestionPosition.left + 20}px`,
            minWidth: "150px",
          }}
        >
          <div className="py-1 max-h-48 overflow-y-auto">
            {hashtagSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 ${
                  index === selectedSuggestionIndex ? "bg-stone-100" : ""
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectSuggestion(suggestion);
                }}
                onMouseEnter={() => setSelectedSuggestionIndex(index)}
              >
                <span className="text-blue-600">#</span>
                {suggestion.name}
              </button>
            ))}
          </div>
          {currentHashtagText && (
            <div className="px-3 py-2 text-xs text-stone-500 border-t border-stone-100">
              Press Enter to add "#{currentHashtagText}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomEditor;
