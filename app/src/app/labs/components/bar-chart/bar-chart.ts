import { Component, ElementRef, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ChartRow, resolveTokenColor } from '../chart-colors';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-bar-chart',
  imports: [],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rows: ChartRow[] = [];
  @Input() comparisonRows?: ChartRow[];
  @Input() primaryLabel = 'Primary';
  @Input() comparisonLabel = 'Comparison';
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

  private get isComparison(): boolean {
    return this.comparisonRows !== undefined;
  }

  ngAfterViewInit() {
    this.themeObserver = new MutationObserver(() => {
      this.chart?.destroy();
      this.chart = null;
      this.render();
    });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  ngOnChanges() {
    this.render();
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.themeObserver?.disconnect();
  }

  private render() {
    if (!this.rows.length) return;
    if (this.isComparison && !this.comparisonRows!.length) return;

    const labels = this.isComparison ? this.rows.map((_, i) => `#${i + 1}`) : this.rows.map((r) => r.label);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = this.rows.map((r) => r.value);
      if (this.isComparison) this.chart.data.datasets[1].data = this.comparisonRows!.map((r) => r.value);
      this.chart.update();
      return;
    }

    const datasets = this.isComparison
      ? [
          {
            label: this.primaryLabel,
            data: this.rows.map((r) => r.value),
            backgroundColor: resolveTokenColor('--fg', 0.12),
            borderColor: resolveTokenColor('--fg', 0.5),
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: this.comparisonLabel,
            data: this.comparisonRows!.map((r) => r.value),
            backgroundColor: resolveTokenColor('--accent', 0.18),
            borderColor: resolveTokenColor('--accent', 0.7),
            borderWidth: 1,
            borderRadius: 3,
          },
        ]
      : [
          {
            data: this.rows.map((r) => r.value),
            backgroundColor: resolveTokenColor('--fg', 0.15),
            borderColor: resolveTokenColor('--fg', 0.6),
            borderWidth: 1,
            borderRadius: 3,
          },
        ];

    const fg = (a: number) => resolveTokenColor('--fg', a);

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: this.isComparison,
            labels: { color: fg(0.45), font: { size: 11 }, boxWidth: 12 },
          },
          tooltip: {
            callbacks: this.isComparison
              ? {
                  label: (ctx) => {
                    const rows = ctx.datasetIndex === 0 ? this.rows : this.comparisonRows!;
                    const row = rows[ctx.dataIndex];
                    if (!row || row.value == null) return `${row?.label ?? '—'}: no data`;
                    return `${row.label}: ${Math.round(row.value).toLocaleString()}`;
                  },
                }
              : {},
          },
        },
        scales: {
          x: {
            ticks: { color: fg(this.isComparison ? 0.4 : 0.5), font: { size: this.isComparison ? 11 : 12 } },
            grid: { color: fg(0.06) },
          },
          y: {
            ticks: { color: fg(this.isComparison ? 0.65 : 0.7), font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }
}
