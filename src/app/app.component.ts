// import { Component } from '@angular/core';
// import { RouterModule, RouterOutlet } from '@angular/router';
// import { CommonModule } from '@angular/common';

// import { MatToolbarModule } from '@angular/material/toolbar';
// import { MatIconModule } from '@angular/material/icon';
// import { MatButtonModule } from '@angular/material/button';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatListModule } from '@angular/material/list';
// import { MatMenuModule } from '@angular/material/menu';

// @Component({
//   selector: 'app-root',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterOutlet,
//     MatToolbarModule,
//     MatIconModule,
//     MatButtonModule,
//     MatSidenavModule,
//     MatListModule,
//     MatMenuModule,
//     RouterModule,
//   ],
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss']
// })
// export class AppComponent {
//   userName = 'Admin';
// }
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {}
