import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Gapcursor from '@tiptap/extension-gapcursor';

// Custom Image Extension with size and alignment support
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => {
          const float = element.style.float;
          const display = element.style.display;
          const margin = element.style.margin;
          if (display === 'block' && margin === '0px auto') return 'center';
          if (float === 'right') return 'right';
          return 'left';
        },
        renderHTML: attributes => {
          const align = attributes.align || 'left';
          if (align === 'center') {
            return {
              style: 'display: block; margin: 0 auto;',
            };
          } else if (align === 'right') {
            return {
              style: 'float: right; margin-left: 1rem;',
            };
          } else {
            return {
              style: 'float: left; margin-right: 1rem;',
            };
          }
        },
      },
    };
  },
});
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Table as TableIcon,
  Trash2,
  RowsIcon,
  Columns,
  Merge,
  Split,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Palette,
  ChevronDown,
  X,
  Check,
  ExternalLink,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

// Image size presets
const IMAGE_SIZE_PRESETS = [
  { label: '25%', value: '25%' },
  { label: '50%', value: '50%' },
  { label: '75%', value: '75%' },
  { label: '100%', value: '100%' },
];

// Color palette for text and highlight
const TEXT_COLORS = [
  { name: '기본', color: '#000000' },
  { name: '회색', color: '#6B7280' },
  { name: '빨강', color: '#DC2626' },
  { name: '주황', color: '#EA580C' },
  { name: '노랑', color: '#CA8A04' },
  { name: '초록', color: '#16A34A' },
  { name: '파랑', color: '#2563EB' },
  { name: '보라', color: '#7C3AED' },
  { name: '분홍', color: '#DB2777' },
];

const HIGHLIGHT_COLORS = [
  { name: '없음', color: '' },
  { name: '노랑', color: '#FEF08A' },
  { name: '초록', color: '#BBF7D0' },
  { name: '파랑', color: '#BFDBFE' },
  { name: '보라', color: '#E9D5FF' },
  { name: '분홍', color: '#FBCFE8' },
  { name: '빨강', color: '#FECACA' },
  { name: '주황', color: '#FED7AA' },
];

// Keyboard shortcuts display
const SHORTCUTS: Record<string, string> = {
  bold: 'Ctrl+B',
  italic: 'Ctrl+I',
  strike: 'Ctrl+Shift+S',
  code: 'Ctrl+E',
  bulletList: 'Ctrl+Shift+8',
  orderedList: 'Ctrl+Shift+7',
  blockquote: 'Ctrl+Shift+B',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
};

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onImageUpload,
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'highlight' | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageWidth, setImageWidth] = useState('50%');
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('left');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: {
          keepMarks: true,
        },
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-700',
          rel: 'noopener noreferrer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 font-semibold',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
      Gapcursor,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Format HTML with line breaks for better readability in code mode
      const html = editor.getHTML();
      const formattedHTML = html
        .replace(/></g, '>\n<')  // Add newlines between tags
        .replace(/(<p>)/g, '\n$1')  // Add newline before paragraphs
        .replace(/(<\/p>)/g, '$1\n')  // Add newline after paragraphs
        .replace(/(<br>)/g, '$1\n')  // Add newline after br tags
        .replace(/(<\/li>)/g, '$1\n')  // Add newline after list items
        .replace(/(<\/h[1-6]>)/g, '$1\n')  // Add newline after headings
        .trim();
      onChange(formattedHTML);
    },
    editorProps: {
      attributes: {
        class: 'passage-content focus:outline-none min-h-[300px] p-4',
      },
      handleDOMEvents: {
        blur: () => {
          // Prevent cursor jumping on blur
          return false;
        },
      },
      handlePaste: (view, event) => {
        // Check clipboard items for images
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // Use Array.from to convert items to array for proper iteration
        const items = Array.from(clipboardData.items || []);

        // Also check files directly (some browsers put images there)
        const files = Array.from(clipboardData.files || []);

        // First check items for image data
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file && onImageUpload) {
              console.log('Pasting image from clipboard items:', file.name, file.type);
              onImageUpload(file).then((url) => {
                const { state } = view;
                const { tr } = state;
                const pos = state.selection.from;
                const node = state.schema.nodes.image.create({ src: url });
                view.dispatch(tr.insert(pos, node));
              }).catch((error) => {
                console.error('Failed to upload pasted image:', error);
                alert('이미지 업로드에 실패했습니다: ' + (error?.message || error));
              });
            } else if (!onImageUpload) {
              console.warn('onImageUpload prop is not provided');
              alert('이미지 업로드 기능이 설정되지 않았습니다.');
            }
            return true;
          }
        }

        // Fallback: check files array directly
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            if (onImageUpload) {
              console.log('Pasting image from clipboard files:', file.name, file.type);
              onImageUpload(file).then((url) => {
                const { state } = view;
                const { tr } = state;
                const pos = state.selection.from;
                const node = state.schema.nodes.image.create({ src: url });
                view.dispatch(tr.insert(pos, node));
              }).catch((error) => {
                console.error('Failed to upload pasted image:', error);
                alert('이미지 업로드에 실패했습니다: ' + (error?.message || error));
              });
            }
            return true;
          }
        }

        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (const file of files) {
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            if (onImageUpload) {
              onImageUpload(file).then((url) => {
                const { state } = view;
                const { tr } = state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const pos = coordinates?.pos ?? state.selection.from;
                const node = state.schema.nodes.image.create({ src: url });
                view.dispatch(tr.insert(pos, node));
              }).catch((error) => {
                console.error('Failed to upload dropped image:', error);
              });
            }
            return true;
          }
        }
        return false;
      },
    },
  });

  // 문제 1 수정: content 변경 시 에디터 내용 동기화
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.color-picker-dropdown')) {
        setShowColorPicker(null);
      }
    };
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColorPicker]);

  const addImage = async () => {
    if (onImageUpload) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const url = await onImageUpload(file);
            setImageUrl(url);
            setImageWidth('50%');
            setImageAlign('left');
            setShowImageModal(true);
          } catch (error) {
            console.error('Failed to upload image:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            alert('이미지 업로드에 실패했습니다: ' + errorMessage);
          }
        }
      };
      input.click();
    } else {
      setImageUrl('');
      setImageWidth('50%');
      setImageAlign('left');
      setShowImageModal(true);
    }
  };

  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;

    // Create image HTML with attributes
    const imgHtml = `<img src="${imageUrl}" />`;
    editor.chain().focus().insertContent(imgHtml).run();

    // Update the newly inserted image with custom attributes
    editor.chain().focus().updateAttributes('image', {
      width: imageWidth,
      align: imageAlign,
    }).run();

    setShowImageModal(false);
    setImageUrl('');
    setImageWidth('50%');
    setImageAlign('left');
  }, [editor, imageUrl, imageWidth, imageAlign]);

  const updateImageSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { width: size }).run();
  }, [editor]);

  const updateImageAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('image', { align }).run();
  }, [editor]);

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '');
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setShowLinkModal(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // If no text is selected and linkText is provided, insert the text with link
      const { from, to } = editor.state.selection;
      if (from === to && linkText) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl, linkText]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
  }, [editor]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingImage(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  }, []);

  const handleDrop = useCallback((_e: React.DragEvent) => {
    setIsDraggingImage(false);
  }, []);

  // Toolbar Button with tooltip
  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    shortcut?: string;
  }> = ({ onClick, isActive, disabled, children, title, shortcut }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${title} (${shortcut})` : title}
      className={`
        relative group p-1.5 rounded-md transition-all duration-150
        ${isActive
          ? 'bg-primary-100 text-primary-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
      {/* Tooltip */}
      <span className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
        text-xs font-medium text-white bg-gray-900 rounded-md
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-150 whitespace-nowrap z-50
        pointer-events-none
      ">
        {title}
        {shortcut && <span className="ml-1 text-gray-400">{shortcut}</span>}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </button>
  );

  // Toolbar Divider
  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-200 mx-1" />
  );

  // Toolbar Group
  const ToolbarGroup: React.FC<{ children: React.ReactNode; label?: string }> = ({ children, label }) => (
    <div className="flex items-center gap-0.5" title={label}>
      {children}
    </div>
  );

  return (
    <div className={`
      border rounded-lg overflow-hidden transition-all duration-200
      ${isDraggingImage
        ? 'border-primary-500 border-2 bg-primary-50'
        : 'border-gray-300 hover:border-gray-400'
      }
    `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex flex-wrap items-center gap-1">
        {/* Text Formatting Group */}
        <ToolbarGroup label="텍스트 서식">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="굵게"
            shortcut={SHORTCUTS.bold}
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="기울임"
            shortcut={SHORTCUTS.italic}
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="취소선"
            shortcut={SHORTCUTS.strike}
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="인라인 코드"
            shortcut={SHORTCUTS.code}
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Heading Group */}
        <ToolbarGroup label="제목">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="제목 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* List & Block Group */}
        <ToolbarGroup label="목록 및 블록">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="글머리 기호"
            shortcut={SHORTCUTS.bulletList}
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="번호 매기기"
            shortcut={SHORTCUTS.orderedList}
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="인용구"
            shortcut={SHORTCUTS.blockquote}
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="구분선"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Alignment Group */}
        <ToolbarGroup label="정렬">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="양쪽 정렬"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Color Group */}
        <ToolbarGroup label="색상">
          {/* Text Color Picker */}
          <div className="relative color-picker-dropdown">
            <ToolbarButton
              onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
              isActive={showColorPicker === 'text'}
              title="글자 색상"
            >
              <div className="flex items-center">
                <Palette className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </div>
            </ToolbarButton>
            {showColorPicker === 'text' && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                <div className="text-xs font-medium text-gray-500 mb-2">글자 색상</div>
                <div className="grid grid-cols-5 gap-1">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => {
                        editor.chain().focus().setColor(c.color).run();
                        setShowColorPicker(null);
                      }}
                      className="w-6 h-6 rounded border border-gray-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative color-picker-dropdown">
            <ToolbarButton
              onClick={() => setShowColorPicker(showColorPicker === 'highlight' ? null : 'highlight')}
              isActive={showColorPicker === 'highlight' || editor.isActive('highlight')}
              title="배경 강조"
            >
              <div className="flex items-center">
                <Highlighter className="w-4 h-4" />
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </div>
            </ToolbarButton>
            {showColorPicker === 'highlight' && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                <div className="text-xs font-medium text-gray-500 mb-2">배경 강조 색상</div>
                <div className="grid grid-cols-4 gap-1">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.color || 'none'}
                      type="button"
                      onClick={() => {
                        if (c.color) {
                          editor.chain().focus().toggleHighlight({ color: c.color }).run();
                        } else {
                          editor.chain().focus().unsetHighlight().run();
                        }
                        setShowColorPicker(null);
                      }}
                      className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                        c.color ? 'border-gray-200' : 'border-gray-300 flex items-center justify-center'
                      }`}
                      style={{ backgroundColor: c.color || '#fff' }}
                      title={c.name}
                    >
                      {!c.color && <X className="w-3 h-3 text-gray-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ToolbarGroup>

        <ToolbarDivider />

        {/* Image Controls - Only visible when image is selected */}
        {editor.isActive('image') && (
          <>
            <ToolbarGroup label="이미지 크기">
              {IMAGE_SIZE_PRESETS.map((preset) => (
                <ToolbarButton
                  key={preset.value}
                  onClick={() => updateImageSize(preset.value)}
                  title={`${preset.label} 크기`}
                >
                  <span className="text-xs font-medium">{preset.label}</span>
                </ToolbarButton>
              ))}
            </ToolbarGroup>

            <ToolbarDivider />

            <ToolbarGroup label="이미지 정렬">
              <ToolbarButton
                onClick={() => updateImageAlign('left')}
                isActive={editor.getAttributes('image').align === 'left'}
                title="왼쪽 정렬"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => updateImageAlign('center')}
                isActive={editor.getAttributes('image').align === 'center'}
                title="가운데 정렬"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>

              <ToolbarButton
                onClick={() => updateImageAlign('right')}
                isActive={editor.getAttributes('image').align === 'right'}
                title="오른쪽 정렬"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
            </ToolbarGroup>

            <ToolbarDivider />
          </>
        )}

        {/* Insert Group */}
        <ToolbarGroup label="삽입">
          <ToolbarButton
            onClick={openLinkModal}
            isActive={editor.isActive('link')}
            title="링크 삽입"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          {editor.isActive('link') && (
            <ToolbarButton
              onClick={removeLink}
              title="링크 제거"
            >
              <Unlink className="w-4 h-4 text-red-500" />
            </ToolbarButton>
          )}

          <ToolbarButton onClick={addImage} title="이미지 삽입">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="표 삽입"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>

        {/* Table Controls - Only visible when in a table */}
        {editor.isActive('table') && (
          <>
            <ToolbarDivider />
            <ToolbarGroup label="표 편집">
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="열 추가"
              >
                <Columns className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="행 추가"
              >
                <RowsIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().mergeCells().run()}
                title="셀 병합"
              >
                <Merge className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().splitCell().run()}
                title="셀 분할"
              >
                <Split className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="열 삭제"
              >
                <Columns className="w-4 h-4 text-red-500" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="행 삭제"
              >
                <RowsIcon className="w-4 h-4 text-red-500" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="표 삭제"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </ToolbarButton>
            </ToolbarGroup>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* History Group */}
        <ToolbarGroup label="실행 취소">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="실행 취소"
            shortcut={SHORTCUTS.undo}
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행"
            shortcut={SHORTCUTS.redo}
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </ToolbarGroup>
      </div>

      {/* Editor Content */}
      <div className="relative max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {isDraggingImage && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary-50/80 z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-primary-600">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm font-medium">이미지를 여기에 놓으세요</span>
            </div>
          </div>
        )}
        <EditorContent
          editor={editor}
          className="passage-content focus:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:outline-none"
        />
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">링크 삽입</h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  링크 텍스트
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="표시할 텍스트"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyLink();
                      }
                    }}
                    autoFocus
                  />
                  <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-200">
              {editor?.isActive('link') && (
                <button
                  type="button"
                  onClick={removeLink}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  링크 제거
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={applyLink}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">이미지 삽입</h3>
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {!onImageUpload && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    이미지 URL
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 크기
                </label>
                <div className="flex gap-2">
                  {IMAGE_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setImageWidth(preset.value)}
                      className={`
                        flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all
                        ${imageWidth === preset.value
                          ? 'bg-primary-100 border-primary-500 text-primary-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    placeholder="예: 300px, 50%, auto"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    픽셀(300px) 또는 퍼센트(50%) 입력 가능
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정렬
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageAlign('left')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2
                      ${imageAlign === 'left'
                        ? 'bg-primary-100 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">왼쪽</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlign('center')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2
                      ${imageAlign === 'center'
                        ? 'bg-primary-100 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <AlignCenter className="w-4 h-4" />
                    <span className="text-sm font-medium">중앙</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlign('right')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg border transition-all flex items-center justify-center gap-2
                      ${imageAlign === 'right'
                        ? 'bg-primary-100 border-primary-500 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <AlignRight className="w-4 h-4" />
                    <span className="text-sm font-medium">오른쪽</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={insertImage}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                삽입
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
