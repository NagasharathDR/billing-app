export interface Product {
  id: number;
  name: string;
  code: string;
  actualPrice?: number;   // NEW
  sellingPrice: number; // RENAMED from price
  unit: string;
}
