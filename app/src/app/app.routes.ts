import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { Lab } from './pages/lab/lab';
import { BcnMap } from './pages/bcn-map/bcn-map';
import { DataContracts } from './pages/data-contracts/data-contracts';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'lab', component: Lab },
  { path: 'lab/bcn-map', component: BcnMap },
  { path: 'lab/data-contracts', component: DataContracts },
];
