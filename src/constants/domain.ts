import {
  Banknote,
  Bus,
  CreditCard,
  GraduationCap,
  Gamepad2,
  Landmark,
  Shapes,
  Utensils,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Category, PaymentMethod } from '../types';

export interface CategoryMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export interface PaymentMeta {
  label: string;
  icon: LucideIcon;
}

/** Os identificadores (chaves) são exatamente os valores do enum do backend. */
export const CATEGORIES: Record<Category, CategoryMeta> = {
  COMIDA: { label: 'Comida', color: '#D98E04', icon: Utensils },
  TRANSPORTE: { label: 'Transporte', color: '#2F6FD0', icon: Bus },
  LAZER: { label: 'Lazer', color: '#8E5BD0', icon: Gamepad2 },
  EDUCACAO: { label: 'Educação', color: '#D2476B', icon: GraduationCap },
  OUTRO: { label: 'Outro', color: '#6B7685', icon: Shapes },
};

export const CATEGORY_ORDER: Category[] = ['COMIDA', 'TRANSPORTE', 'LAZER', 'EDUCACAO', 'OUTRO'];

export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMeta> = {
  PIX: { label: 'Pix', icon: Zap },
  DEBITO: { label: 'Débito', icon: Landmark },
  CREDITO: { label: 'Crédito', icon: CreditCard },
  DINHEIRO: { label: 'Dinheiro', icon: Banknote },
};

export const PAYMENT_ORDER: PaymentMethod[] = ['PIX', 'DEBITO', 'CREDITO', 'DINHEIRO'];
