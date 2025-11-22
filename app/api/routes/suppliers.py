from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import (
    get_current_user,
    get_current_consumer,
    get_current_supplier_owner_or_manager
)
from app.models.models import (
    User, Supplier, Link, LinkStatus, UserRole, AuditLog
)
from app.schemas.schemas import (
    SupplierResponse, LinkCreate, LinkResponse, 
    LinkWithSupplierResponse, LinkWithConsumerResponse
)


router = APIRouter(prefix="/api", tags=["suppliers", "links"])


@router.get("/suppliers", response_model=List[SupplierResponse])
def list_suppliers(
    current_user: User = Depends(get_current_consumer),
    db: Session = Depends(get_db)
):
    """List all active suppliers (for consumers to search and link)."""
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    return suppliers


@router.post("/links", response_model=LinkResponse, status_code=status.HTTP_201_CREATED)
def create_link(
    data: LinkCreate,
    current_user: User = Depends(get_current_consumer),
    db: Session = Depends(get_db)
):
    """Create a link request from consumer to supplier."""
    supplier = db.query(Supplier).filter(Supplier.id == data.supplier_id).first()
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    if not supplier.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier is not active"
        )
    
    existing_link = db.query(Link).filter(
        Link.supplier_id == data.supplier_id,
        Link.consumer_id == current_user.id
    ).first()
    
    if existing_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Link already exists with status: {existing_link.status.value}"
        )
    
    link = Link(
        supplier_id=data.supplier_id,
        consumer_id=current_user.id,
        status=LinkStatus.PENDING
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="LINK_REQUESTED",
        entity_type="LINK",
        entity_id=link.id
    )
    db.add(audit)
    db.commit()
    
    return link


@router.get("/links/me", response_model=List[LinkWithSupplierResponse] | List[LinkWithConsumerResponse])
def get_my_links(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get links for current user (consumer or supplier staff)."""
    if current_user.role == UserRole.CONSUMER:
        links = db.query(Link).filter(Link.consumer_id == current_user.id).all()
        return [LinkWithSupplierResponse.model_validate(link) for link in links]
    else:
        if not current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not associated with a supplier"
            )
        links = db.query(Link).filter(Link.supplier_id == current_user.supplier_id).all()
        return [LinkWithConsumerResponse.model_validate(link) for link in links]


@router.get("/links/pending", response_model=List[LinkWithConsumerResponse])
def get_pending_links(
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Get pending link requests for supplier (OWNER/MANAGER only)."""
    links = db.query(Link).filter(
        Link.supplier_id == current_user.supplier_id,
        Link.status == LinkStatus.PENDING
    ).all()
    
    return [LinkWithConsumerResponse.model_validate(link) for link in links]


@router.post("/links/{link_id}/approve", response_model=LinkResponse)
def approve_link(
    link_id: int,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Approve a pending link request."""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    
    if link.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve links for your supplier"
        )
    
    if link.status != LinkStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Link is not pending (current status: {link.status.value})"
        )
    
    link.status = LinkStatus.APPROVED
    db.commit()
    db.refresh(link)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="LINK_APPROVED",
        entity_type="LINK",
        entity_id=link.id
    )
    db.add(audit)
    db.commit()
    
    return link


@router.post("/links/{link_id}/reject", response_model=LinkResponse)
def reject_link(
    link_id: int,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Reject a pending link request."""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    
    if link.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only reject links for your supplier"
        )
    
    if link.status != LinkStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Link is not pending (current status: {link.status.value})"
        )
    
    link.status = LinkStatus.DECLINED
    db.commit()
    db.refresh(link)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="LINK_DECLINED",
        entity_type="LINK",
        entity_id=link.id
    )
    db.add(audit)
    db.commit()
    
    return link


@router.post("/links/{link_id}/block", response_model=LinkResponse)
def block_link(
    link_id: int,
    current_user: User = Depends(get_current_supplier_owner_or_manager),
    db: Session = Depends(get_db)
):
    """Block a link (optional feature)."""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    
    if link.supplier_id != current_user.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only block links for your supplier"
        )
    
    link.status = LinkStatus.BLOCKED
    db.commit()
    db.refresh(link)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="LINK_BLOCKED",
        entity_type="LINK",
        entity_id=link.id
    )
    db.add(audit)
    db.commit()
    
    return link

