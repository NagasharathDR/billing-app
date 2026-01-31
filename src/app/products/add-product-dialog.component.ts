import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogActions,MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { ProductService } from '../products/product.service';
import { CreateProductRequest } from './create-product.model';

@Component({
  standalone: true,
  selector: 'app-add-product-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDialogActions,
    MatDialogModule
],
  templateUrl: './add-product-dialog.component.html',
  styleUrls: ['./add-product-dialog.component.scss']
})
export class AddProductDialogComponent {

  form = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    actualPrice: [null],
    sellingPrice: [0, Validators.required],
    unit: ['PCS', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private service: ProductService,
    public dialogRef: MatDialogRef<AddProductDialogComponent>
  ) {}

  save() {
    if (this.form.invalid) return;

    const payload: CreateProductRequest = {
      name: this.form.value.name!,
      code: this.form.value.code!,
      unit: this.form.value.unit!,
      sellingPrice: this.form.value.sellingPrice!,
      actualPrice: this.form.value.actualPrice ?? undefined
    };

    this.service.addProduct(payload).subscribe(res => {
      this.dialogRef.close(res);
    });
  }
}
