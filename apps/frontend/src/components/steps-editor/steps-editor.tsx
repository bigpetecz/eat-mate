'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListNode, ListItemNode, $isListNode } from '@lexical/list';
import { $getRoot } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import { OrderedListPlugin } from './ordered-list-plugin';

const theme = {
  // optional: customize styling
  list: {
    ol: 'list-decimal pl-6', // Tailwind classes for ordered list
  },
};

const editorConfig = {
  namespace: 'StepsEditor',
  theme,
  onError(error: Error) {
    console.error(error);
  },
  nodes: [ListNode, ListItemNode],
};

export function extractSteps(
  editorState: import('lexical').EditorState
): string[] {
  const steps: string[] = [];

  editorState.read(() => {
    const root = $getRoot();
    root.getChildren().forEach((node) => {
      if ($isListNode(node)) {
        const listNode = node as ListNode;
        listNode.getChildren().forEach((child) => {
          if ($isListItemNode(child)) {
            const itemNode = child as ListItemNode;
            steps.push(itemNode.getTextContent().trim());
          }
        });
      }
    });
  });

  return steps;
}

export function StepsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (steps: string[]) => void;
}) {
  return (
    <div>
      <LexicalComposer initialConfig={editorConfig}>
        <div className="border border-input rounded-md text-md p-2 bg-white dark:bg-input/30 focus-within:bg-background transition-colors focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] focus-within:ring">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                autoFocus={false}
                className="min-h-[150px] outline-none bg-transparent transition-colors rounded-md px-1 py-1 selection:bg-primary selection:text-primary-foreground"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            onChange(extractSteps(editorState));
          }}
        />
        <OrderedListPlugin initialSteps={value} />
      </LexicalComposer>
    </div>
  );
}
