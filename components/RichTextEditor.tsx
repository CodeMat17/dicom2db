"use client";

import BulletList from "@tiptap/extension-bullet-list";
import Document from "@tiptap/extension-document";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
}

function RichTextEditorComponent({ value, onChange }: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      StarterKit.configure({
        // Disable default extensions we're replacing
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      BulletList.extend({
        name: "customBulletList", // Unique name
      }).configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
      }),
      OrderedList.extend({
        name: "customOrderedList", // Unique name
      }).configure({
        HTMLAttributes: {
          class: "list-decimal ml-4",
        },
      }),
      ListItem.configure({ HTMLAttributes: { class: "ml-4" } }),
    ],
    content: value || "<p>Start typing here...</p>",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert px-3 min-h-[200px] focus:outline-none",
      },
    },
    parseOptions: {
      preserveWhitespace: "full",
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // Explicitly disable immediate rendering
    autofocus: false,
    enableInputRules: false,
    enablePasteRules: false,
  });

  // Client-side mounting
  useEffect(() => {
    setMounted(true);
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  // Sync external value changes with the editor
  useEffect(() => {
    if (mounted && editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, mounted, editor]);

  if (!mounted || !editor)
    return (
      <div className='min-h-[200px] border rounded-md p-4 bg-muted/50 animate-pulse'>
        Loading editor...
      </div>
    );

  return (
    <div className='w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm'>
      {/* Toolbar */}
      <div className='flex gap-2 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 rounded-t-md'>
        <ToolbarButton
          editor={editor}
          command='toggleBold'
          icon={Bold}
          active='bold'
        />
        <ToolbarButton
          editor={editor}
          command='toggleItalic'
          icon={Italic}
          active='italic'
        />
        <ToolbarButton
          editor={editor}
          command='toggleBulletList'
          icon={List}
          active='bulletList'
        />
        <ToolbarButton
          editor={editor}
          command='toggleOrderedList'
          icon={ListOrdered}
          active='orderedList'
        />
      </div>

      {/* Editor Content */}
      <div className='px-2 py-3'>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  editor: Editor;
  command:
    | "toggleBold"
    | "toggleItalic"
    | "toggleBulletList"
    | "toggleOrderedList";
  icon: React.ElementType;
  active: string;
}

function ToolbarButton({
  editor,
  command,
  icon: Icon,
  active,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      className={`p-2 rounded-md transition ${
        editor.isActive(active)
          ? "bg-gray-300 dark:bg-gray-700"
          : "hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
      onClick={() => editor.chain().focus()[command]().run()}>
      <Icon size={20} className='text-gray-700 dark:text-gray-300' />
    </button>
  );
}

// Export with SSR disabled
export const RichTextEditor = dynamic(
  () => Promise.resolve(RichTextEditorComponent),
  {
    ssr: false,
    loading: () => <div className='min-h-[200px] bg-gray-50 animate-pulse' />,
  }
);
