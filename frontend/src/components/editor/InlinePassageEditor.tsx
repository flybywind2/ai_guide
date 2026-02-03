import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Gapcursor from '@tiptap/extension-gapcursor';
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
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Table as TableIcon,
  Columns,
  RowsIcon,
  Merge,
  Split,
  Trash2,
  Save,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import api from '../../services/api';

interface InlinePassageEditorProps {
  passageId: string;
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

// Custom Inline Image Extension
const CustomInlineImage = Image.extend({
  inline: true,
  group: 'inline',

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
        default: 'baseline',
        parseHTML: element => {
          const verticalAlign = element.style.verticalAlign;
          return verticalAlign || 'baseline';
        },
        renderHTML: attributes => {
          const align = attributes.align || 'baseline';
          return {
            style: `vertical-align: ${align}; margin: 0 0.25rem;`,
          };
        },
      },
    };
  },
});

// 클래스명을 컴포넌트 외부에 상수로 정의
const EDITOR_CLASS_NAME = "passage-content max-w-none p-4 min-h-[200px] max-h-[50vh] overflow-y-auto focus:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:outline-none";

// ToolbarButton을 컴포넌트 외부로 이동
const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  danger?: boolean;
}> = ({ onClick, isActive, disabled, children, title, danger }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
      isActive ? 'bg-primary-100 text-primary-700' : danger ? 'text-red-500' : 'text-gray-600'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

export const InlinePassageEditor: React.FC<InlinePassageEditorProps> = ({
  passageId,
  initialContent,
  onSave,
  onCancel,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: {
          keepMarks: true,
        },
      }),
      CustomInlineImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
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
      Gapcursor,
    ],
    content: initialContent,
    editable: true,
    autofocus: 'end',
  });

  // Handle ESC key to exit maximize mode or cancel editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMaximized) {
          setIsMaximized(false);
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized, onCancel]);

  const handleSave = async () => {
    if (!editor) return;

    setIsSaving(true);
    try {
      const content = editor.getHTML();
      // Changed from /admin/passages to /passages (no auth required)
      await api.put(`/passages/${passageId}`, { content });
      onSave(content);
    } catch (error) {
      console.error('Failed to save passage:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('Enter URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  // 툴바 렌더링 함수 (JSX 반환, 컴포넌트 아님)
  const renderToolbar = () => (
    <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-0.5 items-center">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive('link')}
        title="Add Link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Table controls */}
      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>

      {editor.isActive('table') && (
        <>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            title="Add Column"
          >
            <Columns className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            title="Add Row"
          >
            <RowsIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            title="Delete Column"
            danger
          >
            <Columns className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            title="Delete Row"
            danger
          >
            <RowsIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            title="Merge Cells"
          >
            <Merge className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().splitCell().run()}
            title="Split Cell"
          >
            <Split className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            title="Delete Table"
            danger
          >
            <Trash2 className="w-4 h-4" />
          </ToolbarButton>
        </>
      )}

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );

  // Maximized view
  if (isMaximized) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-lg">Edit Passage Content</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Press ESC to minimize</span>
            <button
              type="button"
              onClick={() => setIsMaximized(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {renderToolbar()}

        {/* Editor */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <EditorContent editor={editor} className={EDITOR_CLASS_NAME} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  // Normal inline view
  return (
    <div className="border border-primary-300 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Header with actions */}
      <div className="flex items-center justify-between p-3 bg-primary-50 border-b border-primary-200">
        <span className="text-sm font-medium text-primary-700">Editing Mode</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMaximized(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-colors flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {renderToolbar()}

      {/* Editor Content */}
      <EditorContent editor={editor} className={EDITOR_CLASS_NAME} />
    </div>
  );
};

export default InlinePassageEditor;
