import { Component, ElementRef, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { ChartRow, resolveTokenColor } from '../chart-colors';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

@Component({
  selector: 'app-bar-chart',
  imports: [],
  template: `<canvas #canvas></canvas>`,
  styles: `:host { display: block; } canvas { width: 100% !important; }`,
})
export class BarChart implements AfterViewInit, OnChanges, OnDestroy {
  @Input() rows: ChartRow[] = [];
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private themeObserver: MutationObserver | null = null;

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
    const labels = this.rows.map(r => r.label);
    const data = this.rows.map(r => r.value);

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.update();
      return;
    }

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: resolveTokenColor('--fg', 0.15),
          borderColor: resolveTokenColor('--fg', 0.6),
          borderWidth: 1,
          borderRadius: 3,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: {
            ticks: { color: resolveTokenColor('--fg', 0.5), font: { size: 12 } },
            grid: { color: resolveTokenColor('--fg', 0.06) },
          },
          y: {
            ticks: { color: resolveTokenColor('--fg', 0.7), font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }
}
