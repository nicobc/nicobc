import { Component, ElementRef, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ChartRow, resolveFgColor, resolveAccentRedColor } from '../chart-colors';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-comparison-chart',
  imports: [],
  template: `<canvas #canvas></canvas>`,
  styles: `:host { display: block; } canvas { width: 100% !important; }`,
})
export class ComparisonChart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() batch1: ChartRow[] = [];
  @Input() batch2: ChartRow[] = [];
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

  ngAfterViewInit() {
    this.themeObserver = new MutationObserver(() => {
      this.chart?.destroy();
      this.chart = null;
      if (this.batch1.length && this.batch2.length) this.render();
    });
    this.themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  ngOnChanges() {
    if (this.batch1.length && this.batch2.length) this.render();
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.themeObserver?.disconnect();
  }

  private render() {
    const labels = this.batch1.map((_, i) => `#${i + 1}`);
    const b1Data = this.batch1.map(r => r.value);
    const b2Data = this.batch2.map(r => r.value);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = b1Data;
      this.chart.data.datasets[1].data = b2Data;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Batch 1',
            data: b1Data,
            backgroundColor: resolveFgColor(0.12),
            borderColor: resolveFgColor(0.5),
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: 'Batch 2',
            data: b2Data,
            backgroundColor: resolveAccentRedColor(0.18),
            borderColor: resolveAccentRedColor(0.7),
            borderWidth: 1,
            borderRadius: 3,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: true,
            labels: { color: resolveFgColor(0.45), font: { size: 11 }, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const rows = ctx.datasetIndex === 0 ? this.batch1 : this.batch2;
                const row = rows[ctx.dataIndex];
                if (!row || row.value == null) return `${row?.label ?? '—'}: no data`;
                return `${row.label}: ${Math.round(row.value).toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: resolveFgColor(0.4), font: { size: 11 } },
            grid:  { color: resolveFgColor(0.06) },
          },
          y: {
            ticks: { color: resolveFgColor(0.65), font: { size: 12 } },
            grid:  { display: false },
          },
        },
      },
    });
  }
}
