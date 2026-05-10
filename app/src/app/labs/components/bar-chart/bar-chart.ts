import { Component, ElementRef, Input, AfterViewInit, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { ChartRow } from '../../../pages/data-contracts/data-contracts';

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

  private fg(alpha: number): string {
    const hex = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
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
          backgroundColor: this.fg(0.15),
          borderColor: this.fg(0.6),
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
            ticks: { color: this.fg(0.5), font: { size: 12 } },
            grid: { color: this.fg(0.06) },
          },
          y: {
            ticks: { color: this.fg(0.7), font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }
}
