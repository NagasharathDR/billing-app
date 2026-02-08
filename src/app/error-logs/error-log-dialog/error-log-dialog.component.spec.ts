import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorLogDialogComponent } from './error-log-dialog.component';

describe('ErrorLogDialogComponent', () => {
  let component: ErrorLogDialogComponent;
  let fixture: ComponentFixture<ErrorLogDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorLogDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ErrorLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
