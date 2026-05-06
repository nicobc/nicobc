import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Contact } from './pages/contact/contact';
import { ServicePage } from './pages/service/service';
import { BlogPage } from './pages/blog/blog';
import { BcnMap } from './pages/bcn-map/bcn-map';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'about', component: About },
  { path: 'contact', component: Contact },
  { path: 'services/:slug', component: ServicePage },
  { path: 'blog', component: BlogPage },
  { path: 'blog/:slug', component: BlogPage },
  { path: 'bcn-map', component: BcnMap },
];
