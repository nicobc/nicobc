import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { BcnMap } from './pages/bcn-map/bcn-map';
import { DataContracts } from './pages/data-contracts/data-contracts';
import { DistributedComputing } from './pages/distributed-computing/distributed-computing';
import { Workshops } from './pages/workshops/workshops';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'lab/workshops', component: Workshops },
  { path: 'lab/bcn-map', component: BcnMap },
  { path: 'lab/data-contracts', component: DataContracts },
  { path: 'lab/distributed-computing', component: DistributedComputing },
];
