
// FIX: Removed circular import from './types'.
export enum UserRole {
  Administrator = 'Administrator',
  Manager = 'Manager',
  Owner = 'Owner',
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  fopData: string;
  paymentInfo: string;
  telegramBotToken?: string;
}

export type Page = 'dashboard' | 'orders' | 'calendar' | 'clients' | 'cars' | 'masters' | 'pricelist' | 'cargroups' | 'settings' | 'create-order' | 'order-detail' | 'analytics' | 'inventory';

export interface Client {
  clientID: string;
  firstName: string;
  lastName: string;
  phone: string;
  notes: string;
}
export type NewClient = Omit<Client, 'clientID'>;

export enum FuelType {
  Petrol = 'Бензин',
  Diesel = 'Дизель',
  Electric = 'Електро',
  Hybrid = 'Гібрид',
  Gas = 'Газ',
  Other = 'Інше',
}

export enum AssemblyNode {
  Engine = 'Двигун',
  Transmission = 'Трансмісія',
  FrontChassis = 'Ходова передня',
  RearChassis = 'Ходова задня',
  Brakes = 'Гальмівна система',
  Exhaust = 'Вихлопна система',
  Body = 'Кузов / Світло',
  Maintenance = 'ТО / Рідини',
  Interior = 'Салон / Електрика',
}

export interface SchematicHotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string; // e.g. "200" or "Важіль"
  serviceKeywords: string[]; // keywords to filter services
}

export interface CustomSchematic {
  schematicID: string;
  node: AssemblyNode;
  carModelKeywords: string[]; // e.g. ["W212", "Mercedes E"]
  imageUrl: string;
  hotspots: SchematicHotspot[];
}

export interface Car {
  carID: string;
  ownerID: string;
  make: string;
  model: string;
  year: number;
  engineVolume: number;
  fuel: FuelType;
  licensePlate: string;
  vin: string;
}
export type NewCar = Omit<Car, 'carID'>;

export interface Master {
  masterID: string;
  name: string;
  specialization: string;
  commissionPercentage: number;
  phone?: string;
  notes?: string;
  telegramChatId?: string;
}
export type NewMaster = Omit<Master, 'masterID'>;

export enum ServiceCategory {
  Chassis = 'Ходова частина',
  Engine = 'Двигун',
  Brakes = 'Гальмівна система',
  Maintenance = 'Технічне обслуговування',
  Diagnostics = 'Діагностика',
}

export interface Service {
  serviceID: string;
  category: ServiceCategory;
  assemblyNode?: AssemblyNode;
  tags?: string[]; // Теги для зв'язку зі схемами
  name: string;
  basePrice: number;
  priceOverrides: Record<string, number>;
}
export type NewService = Omit<Service, 'serviceID'>;

export interface CarGroupModelSpec {
    make: string;
    model: string;
    yearFrom?: number;
    yearTo?: number;
}

export interface CarGroup {
    groupId: string;
    name: string;
    models: CarGroupModelSpec[];
}
export type NewCarGroup = Omit<CarGroup, 'groupId'>;


export enum OrderStatus {
  New = 'Нове',
  InProgress = 'В роботі',
  AwaitingParts = 'Очікує запчастин',
  Completed = 'Виконано',
  Cancelled = 'Скасовано',
}

export interface OrderDetail {
  detailID: string;
  orderID: string;
  serviceID: string;
  customName?: string;
  quantity: number;
  cost: number;
}
export type NewOrderDetail = Omit<OrderDetail, 'detailID' | 'orderID'>;


export interface ServiceOrder {
  orderID: string;
  clientID: string;
  carID: string;
  date: string;
  endDate?: string;
  time: string;
  mileage?: number;
  reason: string;
  status: OrderStatus;
  masterIDs: string[];
  diagnosticsNotes?: string;
  photoURLs?: string[];
  isStockDeducted?: boolean;
}
export type NewServiceOrder = Omit<ServiceOrder, 'orderID' | 'status'>;

export interface SuggestedService {
  serviceName: string;
  reason: string;
}

export enum PartStatus {
  Ordered = 'Замовлено',
  Received = 'Отримано',
  Reordered = 'Перезамовлено',
  StockDeducted = 'Списано зі складу',
}

export interface Part {
  partID: string;
  orderID: string;
  name: string;
  partNumber?: string;
  supplier?: string;
  price: number;
  quantity: number;
  status: PartStatus;
  warrantyMonths?: number;
}
export type NewPart = Omit<Part, 'partID'>;

export interface ExtractedPart {
  name: string;
  partNumber?: string;
  quantity: number;
  price: number;
}

// --- НОВІ ТИПИ ДЛЯ СКЛАДУ ---

export enum TransactionType {
    Arrival = 'Прихід',
    Sale = 'Продаж/Списання',
    Return = 'Повернення постачальнику',
    Adjustment = 'Коригування'
}

export interface WarehouseTransaction {
    id: string;
    date: string;
    type: TransactionType;
    docNumber?: string; // Номер накладної
    supplier?: string;
    supplierEdrpou?: string;
    parts: {
        name: string;
        partNumber?: string;
        quantity: number;
        purchasePrice: number;
        sellingPrice?: number;
    }[];
    orderID?: string; // Посилання на наряд (для списання)
    notes?: string;
    totalAmount: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    partNumber?: string;
    quantity: number;
    purchasePrice: number; // Середня ціна закупівлі
    sellingPrice: number;  // Рекомендована ціна продажу
    category?: string;
    minQuantity?: number;  // Поріг для сповіщення
}
