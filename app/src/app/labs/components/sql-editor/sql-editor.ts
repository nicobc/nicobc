import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { sql } from '@codemirror/lang-sql';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';

const THEME: Extension = [
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: [tags.keyword, tags.operatorKeyword], color: 'var(--kw-color)' },
      { tag: tags.string, color: 'var(--string-color)' },
      { tag: tags.number, color: 'var(--accent)' },
      { tag: tags.comment, color: 'color-mix(in srgb, var(--fg) 35%, transparent)', fontStyle: 'italic' },
      { tag: tags.operator, color: 'color-mix(in srgb, var(--fg) 55%, transparent)' },
      { tag: tags.punctuation, color: 'color-mix(in srgb, var(--fg) 45%, transparent)' },
      { tag: tags.function(tags.name), color: 'var(--info)', fontStyle: 'italic' },
    ]),
  ),
  EditorView.theme({
    '&': { background: 'var(--bg)', color: 'var(--fg)', borderRadius: '6px', fontSize: '0.875rem' },
    '.cm-scroller': { fontFamily: "'Fira Code', 'Courier New', monospace" },
    '.cm-content': { caretColor: 'var(--fg)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--fg)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'color-mix(in srgb, var(--info) 18%, transparent)',
    },
    '.cm-gutters': {
      background: 'var(--surface-faint)',
      color: 'color-mix(in srgb, var(--fg) 30%, transparent)',
      border: 'none',
      borderRight: '1px solid var(--border-faint)',
    },
    '.cm-activeLineGutter': { background: 'var(--surface)' },
    '.cm-activeLine': { background: 'color-mix(in srgb, var(--fg) 3%, transparent)' },
  }),
];

@Component({
  selector: 'app-sql-editor',
  imports: [],
  templateUrl: './sql-editor.html',
  styleUrl: './sql-editor.scss',
})
export class SqlEditor implements OnInit, OnChanges, OnDestroy {
  @Input() initialValue = '';
  @Input() solution = '';
  @Input() showActions = true;
  @Input() readonly = false;
  @Output() readonly run = new EventEmitter<string>();
  @Output() readonly valueChange = new EventEmitter<string>();

  readonly runLabel = 'Run';
  readonly revealLabel = 'reveal solution';

  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  private view!: EditorView;
  private readonly editableCompartment = new Compartment();

  ngOnInit(): void {
    this.view = new EditorView({
      state: EditorState.create({
        doc: this.initialValue,
        extensions: [
          basicSetup,
          keymap.of(defaultKeymap),
          sql(),
          THEME,
          this.editableCompartment.of(EditorView.editable.of(!this.readonly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) this.valueChange.emit(update.state.doc.toString());
          }),
        ],
      }),
      parent: this.editorHost.nativeElement,
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['readonly'] && this.view) {
      this.view.dispatch({
        effects: this.editableCompartment.reconfigure(EditorView.editable.of(!this.readonly)),
      });
    }
  }

  ngOnDestroy(): void {
    this.view?.destroy();
  }

  setValue(value: string): void {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: value },
    });
  }

  onRun(): void {
    this.run.emit(this.view.state.doc.toString());
  }

  onReveal(): void {
    this.setValue(this.solution);
  }
}
