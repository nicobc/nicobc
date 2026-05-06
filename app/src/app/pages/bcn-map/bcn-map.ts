import { Component, effect, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Deck } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { polygonToCells } from 'h3-js';
import { ThemeService } from '../../services/theme';

const H3_RESOLUTION = 8;

const INITIAL_VIEW = {
  longitude: 2.13,
  latitude: 41.4,
  zoom: 10.9,
  pitch: 0,
  bearing: -60,
};

@Component({
  selector: 'app-bcn-map',
  imports: [],
  templateUrl: './bcn-map.html',
  styleUrl: './bcn-map.scss',
})
export class BcnMap implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  private deck?: Deck;
  private hexData: { hex: string; value: number }[] = [];
  private geojson: any;
  private themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      if (this.deck && this.hexData.length) {
        this.deck.setProps({ layers: this.buildLayers(theme) });
      }
    });
  }

  ngOnInit(): void {
    fetch('/data/bcn-admin.geojson')
      .then(r => r.json())
      .then(geojson => this.initDeck(geojson));
  }

  ngOnDestroy(): void {
    this.deck?.finalize();
  }

  private initDeck(geojson: any): void {
    this.geojson = geojson;
    const city = geojson.features.find((f: any) => f.properties.nivell === 'ADM_01_PL');
    const cells = this.extractCells(city.geometry);
    this.hexData = cells.map(hex => ({ hex, value: Math.random() }));

    this.deck = new Deck({
      parent: this.container.nativeElement,
      initialViewState: INITIAL_VIEW,
      controller: true,
      style: { background: 'transparent' },
      layers: this.buildLayers(this.themeService.theme()),
    });
  }

  private buildLayers(theme: 'light' | 'dark') {
    const [r, g, b]: [number, number, number] = theme === 'dark' ? [255, 255, 255] : [26, 27, 30];
    return [
      new H3HexagonLayer({
        id: 'hexagons',
        data: this.hexData,
        getHexagon: (d: any) => d.hex,
        getFillColor: (d: any) => [r, g, b, Math.round(10 + d.value * 160)],
        getLineColor: [r, g, b, 25],
        updateTriggers: { getFillColor: theme, getLineColor: theme },
        lineWidthMinPixels: 0.5,
        filled: true,
        stroked: true,
        extruded: false,
        pickable: true,
      }),
      new GeoJsonLayer({
        id: 'districts',
        data: this.geojson,
        stroked: true,
        filled: false,
        getLineColor: (f: any) =>
          f.properties.nivell === 'ADM_01_PL' ? [r, g, b, 60] : [r, g, b, 25],
        updateTriggers: { getLineColor: theme },
        getLineWidth: (f: any) =>
          f.properties.nivell === 'ADM_01_PL' ? 2 : 1,
        lineWidthMinPixels: 1,
      }),
    ];
  }

  private extractCells(geometry: any): string[] {
    const toH3Ring = (ring: [number, number][]) =>
      ring.map(([lng, lat]) => [lat, lng] as [number, number]);

    if (geometry.type === 'Polygon') {
      return polygonToCells(toH3Ring(geometry.coordinates[0]), H3_RESOLUTION);
    }
    if (geometry.type === 'MultiPolygon') {
      return [
        ...new Set<string>(
          geometry.coordinates.flatMap((poly: [number, number][][]) =>
            polygonToCells(toH3Ring(poly[0]), H3_RESOLUTION)
          )
        ),
      ];
    }
    return [];
  }
}
