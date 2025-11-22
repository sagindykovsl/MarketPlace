from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.models.models import User, Supplier, UserRole, AuditLog
from app.schemas.schemas import (
    SupplierRegister, ConsumerRegister, UserLogin, Token, 
    UserResponse, UserMeResponse, SupplierResponse
)


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register/supplier", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_supplier(
    data: SupplierRegister,
    db: Session = Depends(get_db)
):
    """Register a new supplier with an OWNER user."""
    existing_user = db.query(User).filter(User.email == data.owner_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    supplier = Supplier(
        company_name=data.company_name,
        is_active=True
    )
    db.add(supplier)
    db.flush()
    
    owner = User(
        email=data.owner_email,
        password_hash=get_password_hash(data.password),
        full_name=data.owner_full_name,
        role=UserRole.OWNER,
        supplier_id=supplier.id
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    
    audit = AuditLog(
        user_id=owner.id,
        action="SUPPLIER_REGISTERED",
        entity_type="SUPPLIER",
        entity_id=supplier.id
    )
    db.add(audit)
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(owner.id), "role": owner.role.value, "supplier_id": owner.supplier_id}
    )
    
    return Token(access_token=access_token)


@router.post("/register/consumer", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_consumer(
    data: ConsumerRegister,
    db: Session = Depends(get_db)
):
    """Register a new consumer user."""
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    consumer = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        full_name=data.full_name,
        role=UserRole.CONSUMER,
        restaurant_name=data.restaurant_name
    )
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    
    audit = AuditLog(
        user_id=consumer.id,
        action="CONSUMER_REGISTERED",
        entity_type="USER",
        entity_id=consumer.id
    )
    db.add(audit)
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(consumer.id), "role": consumer.role.value}
    )
    
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login and get access token."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    token_data = {"sub": str(user.id), "role": user.role.value}
    if user.supplier_id:
        token_data["supplier_id"] = user.supplier_id
    
    access_token = create_access_token(data=token_data)
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserMeResponse)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's information."""
    response = UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        supplier_id=current_user.supplier_id,
        restaurant_name=current_user.restaurant_name,
        supplier_info=None
    )
    
    if current_user.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == current_user.supplier_id).first()
        if supplier:
            response.supplier_info = SupplierResponse.model_validate(supplier)
    
    return response

