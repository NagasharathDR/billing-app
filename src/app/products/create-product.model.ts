export interface CreateProductRequest {
    name: string;
    code: string;
    unit: string;
    sellingPrice: number;
    actualPrice?: number; // optional
  }
  