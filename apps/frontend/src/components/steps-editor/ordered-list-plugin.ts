import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  TextNode,
} from 'lexical';
import {
  ListNode,
  $createListNode,
  $isListNode,
  $createListItemNode,
  ListItemNode,
} from '@lexical/list';
import { useEffect } from 'react';
/**
 * Enforces an ordered list:
 * - No dummy first line
 * - Enter always creates a new list item directly below current
 * - Can't break list into paragraph
 */
export function OrderedListPlugin({
  initialSteps,
}: {
  initialSteps?: string[];
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Setup initial state
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();

      // Remove any paragraphs
      children.forEach((node) => {
        if (node.getType?.() === 'paragraph') {
          node.remove();
        }
      });

      // Inject steps if provided
      const hasList = root.getChildren().some($isListNode);
      if (initialSteps && initialSteps.length > 0 && !hasList) {
        const ol = $createListNode('number');
        for (const step of initialSteps) {
          const li = $createListItemNode();
          li.append($createTextNode(step));
          ol.append(li);
        }
        root.append(ol);
      }
    });

    // Handle Enter key → new step after current
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const root = $getRoot();
        let listNode = root.getChildren().find($isListNode) as
          | ListNode
          | undefined;

        if (!listNode) {
          listNode = $createListNode('number');
          const li = $createListItemNode();
          li.append($createTextNode(''));
          root.append(listNode);
          listNode.append(li);
          li.select();
          event?.preventDefault();
          return true;
        }

        // Find current ListItemNode from selection
        let currentItem: ListItemNode | null = null;
        let node = selection.anchor.getNode();
        while (node && node.getParent() != null) {
          if (node.getType?.() === 'listitem') {
            currentItem = node as ListItemNode;
            break;
          }
          const parent = node.getParent();
          if (parent == null) {
            break;
          }
          node = parent;
        }

        if (!currentItem) return false;

        editor.update(() => {
          const anchor = selection.anchor;
          // Only handle collapsed selection (cursor, not range)
          if (!selection.isCollapsed()) {
            return;
          }
          const textNode = anchor.getNode();
          if (
            textNode.getType?.() === 'text' &&
            typeof (textNode as TextNode).setTextContent === 'function'
          ) {
            const offset = anchor.offset;
            const textContent = textNode.getTextContent();
            const before = textContent.slice(0, offset);
            const after = textContent.slice(offset);
            // Set current item to before text
            (textNode as any).setTextContent(before);
            // Create new list item with after text
            const newLi = $createListItemNode();
            const afterNode = $createTextNode(after);
            newLi.append(afterNode);
            currentItem.insertAfter(newLi);
            // Place cursor at the beginning of the new item
            afterNode.select(0, 0);
          } else {
            // Fallback: just insert empty new item
            const newLi = $createListItemNode();
            newLi.append($createTextNode(''));
            currentItem.insertAfter(newLi);
            newLi.select();
          }
        });

        event?.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Prevent removal of list entirely
    const unregisterUpdate = editor.registerUpdateListener(() => {
      editor.update(() => {
        const root = $getRoot();
        const listNodes = root.getChildren().filter($isListNode);
        if (listNodes.length === 0) {
          const ol = $createListNode('number');
          ol.append($createListItemNode());
          root.append(ol);
        }
      });
    });

    return () => {
      unregisterEnter();
      unregisterUpdate();
    };
  }, [editor, initialSteps]);

  return null;
}
