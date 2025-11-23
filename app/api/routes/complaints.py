from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.models import (
    User, Order, Complaint, ComplaintStatus, UserRole, AuditLog
)
from app.schemas.schemas import (
    ComplaintCreate, ComplaintUpdate, ComplaintResponse, 
    ComplaintWithDetailsResponse
)


router = APIRouter(prefix="/api", tags=["complaints"])


@router.post("/orders/{order_id}/complaint", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    order_id: int,
    data: ComplaintCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a complaint for an order (CONSUMER only)."""
    if current_user.role != UserRole.CONSUMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only consumers can create complaints"
        )
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.consumer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create complaints for your own orders"
        )
    
    existing_complaint = db.query(Complaint).filter(
        Complaint.order_id == order_id,
        Complaint.status != ComplaintStatus.RESOLVED
    ).first()
    
    if existing_complaint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An open complaint already exists for this order"
        )
    
    complaint = Complaint(
        order_id=order_id,
        raised_by_user_id=current_user.id,
        description=data.description,
        status=ComplaintStatus.OPEN
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="COMPLAINT_CREATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id
    )
    db.add(audit)
    db.commit()
    
    return complaint


@router.get("/complaints", response_model=List[ComplaintWithDetailsResponse])
def get_complaints(
    status_filter: Optional[ComplaintStatus] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complaints for current user."""
    query = db.query(Complaint)
    
    if current_user.role == UserRole.CONSUMER:
        query = query.filter(Complaint.raised_by_user_id == current_user.id)
    else:
        if not current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with a supplier"
            )
        
        query = query.join(Order).filter(Order.supplier_id == current_user.supplier_id)
    
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    
    complaints = query.all()
    return complaints


@router.put("/complaints/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update complaint status."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complaint not found"
        )

    if current_user.role == UserRole.CONSUMER:
        if complaint.raised_by_user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own complaints"
            )
        
        if data.status and data.status != ComplaintStatus.RESOLVED:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Consumers can only mark complaints as resolved"
            )
             
        if data.assigned_to_user_id is not None:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Consumers cannot assign complaints"
            )
            
    else:
        # Supplier staff logic
        order = db.query(Order).filter(Order.id == complaint.order_id).first()
        if not order or order.supplier_id != current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update complaints for your supplier's orders"
            )
    
    if data.status:
        if current_user.role == UserRole.SALES:
            if complaint.status == ComplaintStatus.OPEN:
                if data.status not in [ComplaintStatus.ESCALATED, ComplaintStatus.RESOLVED]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Sales can only escalate or resolve open complaints"
                    )
            elif complaint.status == ComplaintStatus.ESCALATED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sales cannot modify escalated complaints (requires Manager/Owner)"
                )
        
        elif current_user.role in [UserRole.MANAGER, UserRole.OWNER]:
            if data.status == ComplaintStatus.RESOLVED:
                if complaint.status == ComplaintStatus.RESOLVED:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Complaint is already resolved"
                    )
            elif data.status == ComplaintStatus.ESCALATED:
                if complaint.status != ComplaintStatus.OPEN:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Can only escalate open complaints"
                    )
        
        old_status = complaint.status
        complaint.status = data.status
        
        if data.status == ComplaintStatus.RESOLVED and complaint.resolved_at is None:
            complaint.resolved_at = datetime.utcnow()
    
    if data.assigned_to_user_id is not None:
        assigned_user = db.query(User).filter(User.id == data.assigned_to_user_id).first()
        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
        
        if assigned_user.supplier_id != current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only assign complaints to staff from your supplier"
            )
        
        complaint.assigned_to_user_id = data.assigned_to_user_id
    
    db.commit()
    db.refresh(complaint)
    
    audit = AuditLog(
        user_id=current_user.id,
        action=f"COMPLAINT_UPDATED",
        entity_type="COMPLAINT",
        entity_id=complaint.id
    )
    db.add(audit)
    db.commit()
    
    return complaint