from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_consumer,
    get_current_supplier_staff,
    get_current_supplier_owner_or_manager
)
from app.models.models import (
    User, Product, Link, LinkStatus, AuditLog
)
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductResponse
)


router = APIRouter(prefix="/api", tags=["products"])


@router.get("/supplier/products", response_model=List[ProductResponse])
def get_supplier_products(
    current_user: User = Depends(get_current_supplier_staff),
    db: Session = Depends(get_db)
):
    """Get all products for current user's supplier."""
    products = db.query(Product).filter(
        Product.supplier_id == current_user.supplier_id
    ).all()
    return products


@router.post("/supplier/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Create a new product (OWNER/MANAGER only)."""
    product = Product(
        supplier_id=current_user.supplier_id,
        name=data.name,
        description=data.description,
        unit=data.unit,
        price=data.price,
        stock_quantity=data.stock_quantity,
        min_order_quantity=data.min_order_quantity,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="PRODUCT_CREATED",
        entity_type="PRODUCT",
        entity_id=product.id
    )
    db.add(audit)
    db.commit()
    
    return product


@router.put("/supplier/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Update a product (OWNER/MANAGER only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update products for your supplier"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="PRODUCT_UPDATED",
        entity_type="PRODUCT",
        entity_id=product.id
    )
    db.add(audit)
    db.commit()
    
    return product


@router.delete("/supplier/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Soft delete a product by setting is_active to False (OWNER/MANAGER only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete products for your supplier"
        )
    
    db.delete(product)
    db.commit()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="PRODUCT_DELETED",
        entity_type="PRODUCT",
        entity_id=product.id
    )
    db.add(audit)
    db.commit()
    
    return None


@router.get("/suppliers/{supplier_id}/products", response_model=List[ProductResponse])
def get_supplier_products_for_consumer(
    supplier_id: int,
    current_user: User = Depends(get_current_consumer),
    db: Session = Depends(get_db)
):
    """Get products from a supplier (CONSUMER only, must have APPROVED link)."""
    link = db.query(Link).filter(
        Link.supplier_id == supplier_id,
        Link.consumer_id == current_user.id,
        Link.status == LinkStatus.APPROVED
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must have an approved link with this supplier to view their products"
        )
    
    products = db.query(Product).filter(
        Product.supplier_id == supplier_id,
        Product.is_active == True
    ).all()
    
    return products

