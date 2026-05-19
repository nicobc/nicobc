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
import { Compartment, EditorState } from '@codemirror/state';
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
          oneDark,
          this.editableCompartment.of(EditorView.editable.of(!this.readonly)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) this.valueChange.emit(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': { borderRadius: '6px', fontSize: '0.875rem' },
            '.cm-scroller': { fontFamily: "'Fira Code', 'Courier New', monospace" },
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
