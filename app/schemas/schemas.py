from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from decimal import Decimal
from app.models.models import UserRole, LinkStatus, OrderStatus, ComplaintStatus


# Supplier Schemas
class SupplierBase(BaseModel):
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(BaseModel):
    id: int
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Auth Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class SupplierRegister(BaseModel):
    company_name: str
    owner_full_name: str
    owner_email: EmailStr
    password: str


class ConsumerRegister(BaseModel):
    full_name: str
    restaurant_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    supplier_id: Optional[int] = None
    restaurant_name: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserMeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    supplier_id: Optional[int] = None
    restaurant_name: Optional[str] = None
    supplier_info: Optional[SupplierResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# Link Schemas
class LinkCreate(BaseModel):
    supplier_id: int


class LinkResponse(BaseModel):
    id: int
    supplier_id: int
    consumer_id: int
    status: LinkStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class LinkWithSupplierResponse(LinkResponse):
    supplier: SupplierResponse
    
    model_config = ConfigDict(from_attributes=True)


class LinkWithConsumerResponse(LinkResponse):
    consumer: UserResponse
    
    model_config = ConfigDict(from_attributes=True)


# Product Schemas
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    unit: str
    price: Decimal
    stock_quantity: int
    min_order_quantity: int = 1


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    min_order_quantity: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    supplier_id: int
    name: str
    description: Optional[str] = None
    unit: str
    price: Decimal
    stock_quantity: int
    min_order_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: ProductResponse
    
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    supplier_id: int
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: int
    supplier_id: int
    consumer_id: int
    status: OrderStatus
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    total_amount: Decimal
    
    model_config = ConfigDict(from_attributes=True)


class OrderWithDetailsResponse(OrderResponse):
    supplier: SupplierResponse
    consumer: UserResponse
    has_complaint: bool = False
    
    model_config = ConfigDict(from_attributes=True)


# Message Schemas
class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: int
    link_id: int
    sender_id: int
    content: str
    attachment_url: Optional[str] = None
    created_at: datetime
    sender: UserResponse
    
    model_config = ConfigDict(from_attributes=True)


# Complaint Schemas
class ComplaintCreate(BaseModel):
    description: str


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assigned_to_user_id: Optional[int] = None


class ComplaintResponse(BaseModel):
    id: int
    order_id: int
    raised_by_user_id: int
    assigned_to_user_id: Optional[int] = None
    status: ComplaintStatus
    description: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ComplaintWithDetailsResponse(ComplaintResponse):
    raised_by_user: UserResponse
    assigned_to_user: Optional[UserResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

