from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from decimal import Decimal
from app.db.session import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_consumer,
    get_current_supplier_owner_or_manager
)
from app.models.models import (
    User, Order, OrderItem, Product, Link, LinkStatus, 
    OrderStatus, UserRole, AuditLog
)
from app.schemas.schemas import (
    OrderCreate, OrderResponse, OrderWithDetailsResponse, 
    OrderStatusUpdate, ProductResponse
)


router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_consumer),
    db: Session = Depends(get_db)
):
    """Create a new order (CONSUMER only)."""
    link = db.query(Link).filter(
        Link.supplier_id == data.supplier_id,
        Link.consumer_id == current_user.id,
        Link.status == LinkStatus.APPROVED
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an approved link with this supplier to place an order"
        )
    
    if not data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )
    
    product_ids = [item.product_id for item in data.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.supplier_id == data.supplier_id
    ).all()
    
    if len(products) != len(product_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more products not found or do not belong to this supplier"
        )
    
    product_map = {p.id: p for p in products}
    
    for item in data.items:
        product = product_map.get(item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item.product_id} not found"
            )
        
        if not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product.name} is not available"
            )
        
        if item.quantity < product.min_order_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product.name} requires minimum order quantity of {product.min_order_quantity}"
            )
        
        if item.quantity > product.stock_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {product.name} has insufficient stock (available: {product.stock_quantity})"
            )
    
    order = Order(
        supplier_id=data.supplier_id,
        consumer_id=current_user.id,
        created_by_user_id=current_user.id,
        status=OrderStatus.PENDING
    )
    db.add(order)
    db.flush()
    
    for item in data.items:
        product = product_map[item.product_id]
        subtotal = Decimal(str(item.quantity)) * product.price
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=product.price,
            subtotal=subtotal
        )
        db.add(order_item)
    
    db.commit()
    db.refresh(order)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="ORDER_CREATED",
        entity_type="ORDER",
        entity_id=order.id
    )
    db.add(audit)
    db.commit()
    
    return order


@router.get("", response_model=List[OrderResponse])
def get_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get orders for current user (consumer or supplier staff)."""
    query = db.query(Order)
    
    if current_user.role == UserRole.CONSUMER:
        query = query.filter(Order.consumer_id == current_user.id)
    else:
        if not current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with a supplier"
            )
        query = query.filter(Order.supplier_id == current_user.supplier_id)
    
    if status_filter:
        query = query.filter(Order.status == status_filter)
    
    orders = query.all()
    return orders


@router.get("/{order_id}", response_model=OrderWithDetailsResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order details."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if current_user.role == UserRole.CONSUMER:
        if order.consumer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own orders"
            )
    else:
        if not current_user.supplier_id or order.supplier_id != current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view orders for your supplier"
            )
    
    has_complaint = len(order.complaints) > 0
    
    response = OrderWithDetailsResponse(
        id=order.id,
        supplier_id=order.supplier_id,
        consumer_id=order.consumer_id,
        status=order.status,
        created_by_user_id=order.created_by_user_id,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=order.items,
        supplier=order.supplier,
        consumer=order.consumer,
        has_complaint=has_complaint
    )
    
    return response


@router.put("/{order_id}", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Update order status (OWNER/MANAGER only)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update orders for your supplier"
        )
    
    allowed_statuses = [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.COMPLETED]
    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {[s.value for s in allowed_statuses]}"
        )
    
    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change status of completed order"
        )
    
    old_status = order.status
    order.status = data.status
    db.commit()
    db.refresh(order)
    
    audit = AuditLog(
        user_id=current_user.id,
        action=f"ORDER_STATUS_CHANGED_{old_status.value}_TO_{data.status.value}",
        entity_type="ORDER",
        entity_id=order.id
    )
    db.add(audit)
    db.commit()
    
    return order

