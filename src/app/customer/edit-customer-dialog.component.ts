import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions, MatDialogContent } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CustomerService } from './customer.service';
import { Customer } from './customer.model';



@Component({
  standalone: true,
  selector: 'app-edit-customer-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogActions,
    MatDialogContent
],
  templateUrl: './edit-customer-dialog.component.html',
  styleUrls: ['./edit-customer-dialog.component.scss']
})
export class EditCustomerDialogComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: CustomerService,
    private dialogRef: MatDialogRef<EditCustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Customer
  ) {
    this.form = this.fb.group({
      phone: [{ value: data.phone, disabled: true }],
      name: [data.name, Validators.required],
      address: [data.address || '']
    });
  }

  save() {
    if (this.form.invalid) return;

    const updated: Customer = {
      ...this.data,
      name: this.form.value.name,
      address: this.form.value.address
    };

    this.service.update(updated).subscribe(res => {
      this.dialogRef.close(res);
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
