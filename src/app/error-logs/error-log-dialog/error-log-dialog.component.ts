import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-log-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  templateUrl: './error-log-dialog.component.html',
  styleUrls: ['./error-log-dialog.component.scss']
})
export class ErrorLogDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      message: string;
      methodName?: string;
      path?: string;
      stackTrace?: string;
    }
  ) {}

}
