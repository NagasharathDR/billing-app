import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { ErrorLogDialogComponent } from "./error-log-dialog/error-log-dialog.component";
import { HttpClient } from "@angular/common/http";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatTableModule } from "@angular/material/table";
import { environment } from "../../environments/environment";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from "@angular/material/card";


@Component({
  standalone: true,
  selector: 'app-error-logs',
  templateUrl: './error-logs.component.html',
  styleUrls: ['./error-logs.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule
]
})
export class ErrorLogsComponent implements OnInit {

  logs: any[] = [];
  displayedColumns = ['date', 'message', 'method', 'actions'];
  baseUrl= environment.apiBaseUrl+'/app-logs';
  page = 1;
  pageSize = 20;
  totalCount = 0;

  fromDate?: Date;
  toDate?: Date;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    const params: any = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.fromDate)
      params.fromDate = this.fromDate.toLocaleDateString();

    if (this.toDate)
      params.toDate = this.toDate.toLocaleDateString();

    this.http.get<any>(this.baseUrl, { params })
      .subscribe(res => {
        this.logs = res.data;
        this.totalCount = res.totalCount;
      });
  }

  onPageChange(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.pageSize = e.pageSize;
    this.loadLogs();
  }

  resetFilters() {
    this.fromDate = undefined;
    this.toDate = undefined;
    this.page = 1;
    this.loadLogs();
  }

  view(log: any) {
    this.dialog.open(ErrorLogDialogComponent, {
      width: '800px',
      data: log
    });
  }

  truncateLogs() {
    if (!confirm('This will permanently delete all application logs. Continue?')) {
      return;
    }
  
    this.http.delete(this.baseUrl+'/truncate')
      .subscribe(() => {
        this.logs = [];
        alert('Logs cleared successfully');
      });
  }
}
