'use client';
import { useEffect, useRef } from 'react';
import { basicSetup } from 'codemirror';
import { EditorState, RangeSet, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';
import { inkDark } from '../theme/ink-dark';

const setErrorLine = StateEffect.define<number | null>();

const errorLineField = StateField.define<RangeSet<Decoration>>({
  create: () => RangeSet.empty,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        const line = effect.value;
        if (line == null) return RangeSet.empty;
        const clamped = Math.min(Math.max(line, 1), tr.state.doc.lines);
        const from = tr.state.doc.line(clamped).from;
        return RangeSet.of([
          Decoration.line({ attributes: { class: 'cm-error-line' } }).range(from),
        ]);
      }
    }
    return value;
  },
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  errorLine: number | null;
}

export default function CodeEditor({ value, onChange, errorLine }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      parent: containerRef.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          inkDark,
          StreamLanguage.define(stex),
          EditorView.lineWrapping,
          errorLineField,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setErrorLine.of(errorLine) });
    if (errorLine != null) {
      const clamped = Math.min(Math.max(errorLine, 1), view.state.doc.lines);
      view.dispatch({ effects: EditorView.scrollIntoView(clamped, { y: 'center' }) });
    }
  }, [errorLine]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden " />;
}
