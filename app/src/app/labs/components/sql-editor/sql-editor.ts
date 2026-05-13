import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { basicSetup } from 'codemirror';

@Component({
  selector: 'app-sql-editor',
  imports: [],
  templateUrl: './sql-editor.html',
  styleUrl: './sql-editor.scss',
})
export class SqlEditor implements OnInit, OnDestroy {
  @Input() initialValue = '';
  @Input() solution = '';
  @Output() run = new EventEmitter<string>();

  readonly runLabel = 'Run';
  readonly revealLabel = 'reveal solution';

  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLDivElement>;

  private view!: EditorView;

  ngOnInit() {
    this.view = new EditorView({
      state: EditorState.create({
        doc: this.initialValue,
        extensions: [
          basicSetup,
          keymap.of(defaultKeymap),
          sql(),
          oneDark,
          EditorView.theme({
            '&': { borderRadius: '6px', fontSize: '0.875rem' },
            '.cm-scroller': { fontFamily: "'Fira Code', 'Courier New', monospace" },
          }),
        ],
      }),
      parent: this.editorHost.nativeElement,
    });
  }

  ngOnDestroy() {
    this.view?.destroy();
  }

  onRun() {
    this.run.emit(this.view.state.doc.toString());
  }

  onReveal() {
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: this.solution },
    });
  }
}
