import { AfterViewInit, Component, ElementRef, ViewChild, signal, viewChildren } from '@angular/core';

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
})
export class SchemaPanel implements AfterViewInit {
  readonly tables = TABLES;
  readonly expanded = signal(new Set<string>());
  readonly lines = signal<Line[]>([]);
  readonly activeRelKey = signal<string | null>(null);

  @ViewChild('schemaGrid') private containerRef!: ElementRef<HTMLElement>;
  private readonly headerRefs = viewChildren<ElementRef<HTMLElement>>('entityHeader');

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
    setTimeout(() => this.computeLines(), 0);
  }

  onFieldHover(tableId: string, field: SchemaField): void {
    if (field.pk) {
      this.activeRelKey.set(`${tableId}.${field.name}`);
    } else if (field.fk) {
      this.activeRelKey.set(`${field.fk.table}.${field.fk.field}`);
    }
  }

  onFieldLeave(): void {
    this.activeRelKey.set(null);
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
    const refs = this.headerRefs();
    if (refs.length !== 4 || !this.containerRef) return;
    const cr = this.containerRef.nativeElement.getBoundingClientRect();
    const [dimC, dimP, fctO, fctOI] = refs.map((r) => {
      const b = r.nativeElement.getBoundingClientRect();
      return {
        top: b.top - cr.top,
        bottom: b.bottom - cr.top,
        left: b.left - cr.left,
        right: b.right - cr.left,
        midX: (b.left + b.right) / 2 - cr.left,
        midY: (b.top + b.bottom) / 2 - cr.top,
      };
    });
    this.lines.set([
      { id: 'rel-dim_customer', x1: dimC.midX, y1: dimC.bottom, x2: fctO.midX, y2: fctO.top },
      { id: 'rel-dim_product', x1: dimP.midX, y1: dimP.bottom, x2: fctOI.midX, y2: fctOI.top },
      { id: 'rel-fct_order', x1: fctO.right, y1: fctO.midY, x2: fctOI.left, y2: fctOI.midY },
    ]);
  }
}
