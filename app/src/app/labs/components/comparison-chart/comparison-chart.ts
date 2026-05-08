import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { ChartRow } from '../../../pages/data-contracts/data-contracts';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@Component({
  selector: 'app-comparison-chart',
  imports: [],
  template: `<canvas #canvas></canvas>`,
  styles: `:host { display: block; } canvas { width: 100% !important; }`,
})
export class ComparisonChart implements OnChanges, OnDestroy {
  @Input() batch1: ChartRow[] = [];
  @Input() batch2: ChartRow[] = [];
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  ngOnChanges() {
    if (this.batch1.length && this.batch2.length) this.render();
  }

  ngOnDestroy() {
    this.chart?.destroy();
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
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderColor: 'rgba(255,255,255,0.5)',
            borderWidth: 1,
            borderRadius: 3,
          },
          {
            label: 'Batch 2',
            data: b2Data,
            backgroundColor: 'rgba(248,113,113,0.18)',
            borderColor: 'rgba(248,113,113,0.7)',
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
            labels: { color: 'rgba(255,255,255,0.45)', font: { size: 11 }, boxWidth: 12 },
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
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 11 } },
            grid:  { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            ticks: { color: 'rgba(255,255,255,0.65)', font: { size: 12 } },
            grid:  { display: false },
          },
        },
      },
    });
  }
}
