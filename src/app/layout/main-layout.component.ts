import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {

  isMobile = false;
  isCollapsed = false;
  isOpened = true;

  constructor(private auth: AuthService,
    private router: Router) {
    this.updateScreen();
  }

  @HostListener('window:resize')
  updateScreen() {
    this.isMobile = window.innerWidth < 768;

    if (this.isMobile) {
      this.isOpened = false;
      this.isCollapsed = false;
    } else {
      this.isOpened = true;
    }
  }

  toggleSidebar() {
    if (this.isMobile) {
      this.isOpened = !this.isOpened;
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  closeIfMobile() {
    if (this.isMobile) {
      this.isOpened = false;
    }
  }

  get contentMargin(): string {
    if (this.isMobile) return '0px';
    return this.isCollapsed ? '72px' : '260px';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
