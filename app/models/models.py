from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Numeric, DateTime,
    ForeignKey, Enum, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base


class UserRole(str, enum.Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    SALES = "SALES"
    CONSUMER = "CONSUMER"


class LinkStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DECLINED = "DECLINED"
    BLOCKED = "BLOCKED"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    restaurant_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="staff", foreign_keys=[supplier_id])
    created_orders = relationship("Order", back_populates="created_by_user", foreign_keys="Order.created_by_user_id")
    consumer_orders = relationship("Order", back_populates="consumer", foreign_keys="Order.consumer_id")
    sent_messages = relationship("Message", back_populates="sender")
    raised_complaints = relationship("Complaint", back_populates="raised_by_user", foreign_keys="Complaint.raised_by_user_id")
    assigned_complaints = relationship("Complaint", back_populates="assigned_to_user", foreign_keys="Complaint.assigned_to_user_id")
    audit_logs = relationship("AuditLog", back_populates="user")


class Supplier(Base):
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    staff = relationship("User", back_populates="supplier", foreign_keys="User.supplier_id")
    links = relationship("Link", back_populates="supplier")
    products = relationship("Product", back_populates="supplier")
    orders = relationship("Order", back_populates="supplier")


class Link(Base):
    __tablename__ = "links"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    consumer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(LinkStatus), default=LinkStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint('supplier_id', 'consumer_id', name='uq_supplier_consumer'),
    )
    
    # Relationships
    supplier = relationship("Supplier", back_populates="links")
    consumer = relationship("User")
    messages = relationship("Message", back_populates="link")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    unit = Column(String, nullable=False)  # e.g., "kg", "l", "pack"
    price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, nullable=False)
    min_order_quantity = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product", cascade="all, delete")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    consumer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    supplier = relationship("Supplier", back_populates="orders")
    consumer = relationship("User", back_populates="consumer_orders", foreign_keys=[consumer_id])
    created_by_user = relationship("User", back_populates="created_orders", foreign_keys=[created_by_user_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="order")

    @property
    def total_amount(self):
        return sum((item.subtotal for item in self.items), 0)


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    link_id = Column(Integer, ForeignKey("links.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    attachment_url = Column(String, nullable=True)  # Stubbed for future use
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    link = relationship("Link", back_populates="messages")
    sender = relationship("User", back_populates="sent_messages")


class Complaint(Base):
    __tablename__ = "complaints"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    raised_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.OPEN, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="complaints")
    raised_by_user = relationship("User", back_populates="raised_complaints", foreign_keys=[raised_by_user_id])
    assigned_to_user = relationship("User", back_populates="assigned_complaints", foreign_keys=[assigned_to_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)  # e.g., "LINK_APPROVED", "ORDER_ACCEPTED"
    entity_type = Column(String, nullable=False)  # e.g., "LINK", "ORDER", "COMPLAINT"
    entity_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

