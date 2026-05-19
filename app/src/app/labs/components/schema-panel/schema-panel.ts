import { AfterViewInit, Component, ElementRef, Input, ViewChild, signal, viewChildren } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck, faCopy } from '@fortawesome/free-solid-svg-icons';

interface SchemaField {
  name: string;
  sqlType: string;
  pk?: boolean;
  fk?: { table: string; field: string };
}

interface SchemaTable {
  id: string;
  kind: 'DIM' | 'FCT';
  name: string;
  fields: SchemaField[];
}

interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const TABLES: SchemaTable[] = [
  {
    id: 'dim_customer',
    kind: 'DIM',
    name: 'dim_customer',
    fields: [
      { name: 'customer_id', sqlType: 'INT', pk: true },
      { name: 'customer_name', sqlType: 'VARCHAR' },
      { name: 'country', sqlType: 'VARCHAR' },
      { name: 'created_at', sqlType: 'TIMESTAMP' },
      { name: 'updated_at', sqlType: 'TIMESTAMP' },
    ],
  },
  {
    id: 'dim_product',
    kind: 'DIM',
    name: 'dim_product',
    fields: [
      { name: 'product_id', sqlType: 'INT', pk: true },
      { name: 'product_name', sqlType: 'VARCHAR' },
      { name: 'category', sqlType: 'VARCHAR' },
      { name: 'unit_price', sqlType: 'DECIMAL' },
      { name: 'created_at', sqlType: 'TIMESTAMP' },
      { name: 'updated_at', sqlType: 'TIMESTAMP' },
    ],
  },
  {
    id: 'fct_order',
    kind: 'FCT',
    name: 'fct_order',
    fields: [
      { name: 'order_id', sqlType: 'INT', pk: true },
      { name: 'customer_id', sqlType: 'INT', fk: { table: 'dim_customer', field: 'customer_id' } },
      { name: 'amount', sqlType: 'DECIMAL' },
      { name: 'order_date', sqlType: 'DATE' },
      { name: 'created_at', sqlType: 'TIMESTAMP' },
      { name: 'updated_at', sqlType: 'TIMESTAMP' },
    ],
  },
  {
    id: 'fct_order_item',
    kind: 'FCT',
    name: 'fct_order_item',
    fields: [
      { name: 'order_id', sqlType: 'INT', fk: { table: 'fct_order', field: 'order_id' } },
      { name: 'product_id', sqlType: 'INT', fk: { table: 'dim_product', field: 'product_id' } },
      { name: 'quantity', sqlType: 'INT' },
      { name: 'created_at', sqlType: 'TIMESTAMP' },
      { name: 'updated_at', sqlType: 'TIMESTAMP' },
    ],
  },
];

// Maps line id → 'pkTable.pkField' key used by hover state
const REL_MAP: Record<string, string> = {
  'rel-dim_customer': 'dim_customer.customer_id',
  'rel-dim_product': 'dim_product.product_id',
  'rel-fct_order': 'fct_order.order_id',
};

@Component({
  selector: 'app-schema-panel',
  templateUrl: './schema-panel.html',
  styleUrl: './schema-panel.scss',
  imports: [FaIconComponent],
})
export class SchemaPanel implements AfterViewInit {
  @Input() copyable = false;

  readonly tables = TABLES;
  readonly expanded = signal(new Set<string>());
  readonly lines = signal<Line[]>([]);
  readonly activeRelKey = signal<string | null>(null);
  readonly justCopied = signal<string | null>(null);
  readonly showCheck = signal<string | null>(null);

  readonly copyIcon = faCopy;
  readonly checkIcon = faCheck;

  @ViewChild('schemaGrid') private containerRef!: ElementRef<HTMLElement>;
  private readonly headerRefs = viewChildren<ElementRef<HTMLElement>>('entityHeader');
  private readonly cardRefs = viewChildren<ElementRef<HTMLElement>>('entityCard');

  ngAfterViewInit(): void {
    setTimeout(() => this.computeLines(), 0);
  }

  toggle(tableId: string): void {
    this.expanded.update((s) => {
      const next = new Set(s);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  onFieldHover(tableId: string, field: SchemaField): void {
    this.computeLines();
    if (field.pk) {
      this.activeRelKey.set(`${tableId}.${field.name}`);
    } else if (field.fk) {
      this.activeRelKey.set(`${field.fk.table}.${field.fk.field}`);
    }
  }

  onFieldLeave(): void {
    this.activeRelKey.set(null);
  }

  copyField(fieldName: string): void {
    navigator.clipboard.writeText(fieldName);
    this.showCheck.set(fieldName);
    this.justCopied.set(fieldName);
    setTimeout(() => {
      this.justCopied.set(null);
      setTimeout(() => this.showCheck.set(null), 150);
    }, 600);
  }

  ann(field: SchemaField): string {
    if (field.pk) return '#';
    if (field.fk) return '→';
    return '';
  }

  isLineHighlighted(lineId: string): boolean {
    const key = this.activeRelKey();
    return key !== null && REL_MAP[lineId] === key;
  }

  isTableHighlighted(tableId: string): boolean {
    const key = this.activeRelKey();
    if (!key) return false;
    if (key.startsWith(`${tableId}.`)) return true;
    const table = TABLES.find((t) => t.id === tableId);
    return table?.fields.some((f) => f.fk && `${f.fk.table}.${f.fk.field}` === key) ?? false;
  }

  private computeLines(): void {
    const headers = this.headerRefs();
    const cards = this.cardRefs();
    if (headers.length !== 4 || cards.length !== 4 || !this.containerRef) return;
    const cr = this.containerRef.nativeElement.getBoundingClientRect();
    const h = headers.map((r) => {
      const b = r.nativeElement.getBoundingClientRect();
      return { midX: (b.left + b.right) / 2 - cr.left, midY: (b.top + b.bottom) / 2 - cr.top };
    });
    const c = cards.map((r) => {
      const b = r.nativeElement.getBoundingClientRect();
      return {
        top: b.top - cr.top,
        bottom: b.bottom - cr.top,
        left: b.left - cr.left,
        right: b.right - cr.left,
      };
    });
    const [hDimC, hDimP, hFctO, hFctOI] = h;
    const [cDimC, cDimP, cFctO, cFctOI] = c;
    this.lines.set([
      { id: 'rel-dim_customer', x1: hDimC.midX, y1: cDimC.bottom, x2: hFctO.midX, y2: cFctO.top },
      { id: 'rel-dim_product', x1: hDimP.midX, y1: cDimP.bottom, x2: hFctOI.midX, y2: cFctOI.top },
      { id: 'rel-fct_order', x1: cFctO.right, y1: hFctO.midY, x2: cFctOI.left, y2: hFctOI.midY },
    ]);
  }
}
