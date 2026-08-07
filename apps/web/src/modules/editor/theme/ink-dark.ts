import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import type { Extension } from '@codemirror/state';

const TAB_SIZE = 4;

export const inkDark = [inkDarkTheme(), inkDarkHighlightExt(), indentGuides()];

function inkDarkTheme(): Extension {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '15px',
        backgroundColor: '#1E1E1E',
        color: '#D4D4D4',
        '--cm-ink-guide': '#3A3D41',
      },
      '.cm-scroller': {
        fontFamily: 'inherit',
        lineHeight: '24px',
      },
      '.cm-content': {
        padding: '4px 12px',
        caretColor: '#AEAFAD',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#AEAFAD',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, &.cm-focused .cm-content ::selection':
      {
        backgroundColor: 'rgba(38, 79, 120, 0.45)',
      },
      '.cm-selectionMatch': {
        backgroundColor: 'rgba(86, 156, 214, 0.25)',
      },
      '.cm-gutters': {
        backgroundColor: '#1E1E1E',
        color: '#858585',
        borderRight: '1px solid #333333',
        paddingLeft: '0',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: '#858585',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: '#C6C6C6',
      },
      '.cm-foldGutter, .cm-foldGutter span': {
        color: '#858585',
      },
      '.cm-matchingBracket': {
        backgroundColor: 'rgba(52, 108, 163, 0.4)',
        outline: '1px solid rgba(120, 180, 255, 0.4)',
      },
      '.cm-searchMatch': {
        backgroundColor: 'rgba(255, 204, 0, 0.25)',
      },
      '&.cm-focused': { outline: 'none' },
    },
    { dark: true },
  );
}

function inkDarkHighlightExt(): Extension {
  return syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.comment, color: '#6A9955', fontStyle: 'italic' },
      { tag: [tags.keyword, tags.controlKeyword, tags.tagName, tags.definition(tags.keyword)], color: '#569CD6' },
      { tag: [tags.string, tags.special(tags.string)], color: '#CE9178' },
      { tag: [tags.number, tags.atom, tags.bool], color: '#B5CEA8' },
      { tag: [tags.typeName, tags.className, tags.namespace, tags.definition(tags.typeName)], color: '#4EC9B0' },
      { tag: tags.variableName, color: '#D4D4D4' },
      { tag: tags.special(tags.variableName), color: '#D4D4D4' },
      { tag: tags.standard(tags.variableName), color: '#4FC1FF' },
      { tag: [tags.operator, tags.punctuation, tags.bracket, tags.squareBracket, tags.paren], color: '#9E9E9E' },
      { tag: tags.invalid, color: '#F48771' },
    ]),
  );
}

class IndentGuide extends WidgetType {
  eq(): boolean {
    return true;
  }

  ignoreEvent(): boolean {
    return true;
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-indentMarker';
    span.style.cssText =
      'display:inline-block;height:100%;width:0;box-sizing:border-box;background-image:linear-gradient(var(--cm-ink-guide),var(--cm-ink-guide));background-size:1px 100%;background-repeat:no-repeat;background-position:left center;';
    return span;
  }
}

function buildIndentGuides(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = view.state.doc.lineAt(pos);
      let contentCol = 0;
      const text = line.text;
      const len = text.length;
      let i = 0;
      while (i < len) {
        const ch = text.charCodeAt(i);
        if (ch === 32) {
          contentCol++;
          i++;
        } else if (ch === 9) {
          contentCol += TAB_SIZE - (contentCol % TAB_SIZE);
          i++;
        } else {
          break;
        }
      }

      let lastPos = line.from;
      for (let level = 1; level * TAB_SIZE <= contentCol; level++) {
        const target = line.from + level * TAB_SIZE;
        const widgetPos = Math.min(target, line.from + Math.max(contentCol - 1, 0), line.to);
        if (widgetPos > lastPos && widgetPos > line.from) {
          builder.add(
            widgetPos,
            widgetPos,
            Decoration.widget({ widget: new IndentGuide(), side: -1 }),
          );
          lastPos = widgetPos;
        }
      }

      pos = line.to + 1;
    }
  }
  return builder.finish();
}

function indentGuides(): Extension {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildIndentGuides(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.selectionSet) {
          this.decorations = buildIndentGuides(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}