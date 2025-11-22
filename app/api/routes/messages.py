from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.models import (
    User, Link, Message, UserRole
)
from app.schemas.schemas import (
    MessageCreate, MessageResponse
)


router = APIRouter(prefix="/api/messages", tags=["messages"])


def check_link_access(link_id: int, current_user: User, db: Session) -> Link:
    """Check if user has access to this link."""
    link = db.query(Link).filter(Link.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    
    if current_user.role == UserRole.CONSUMER:
        if link.consumer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access messages for your own links"
            )
    else:
        if not current_user.supplier_id or link.supplier_id != current_user.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access messages for your supplier's links"
            )
    
    return link


@router.get("/{link_id}", response_model=List[MessageResponse])
def get_messages(
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages for a link."""
    check_link_access(link_id, current_user, db)
    
    messages = db.query(Message).filter(
        Message.link_id == link_id
    ).order_by(Message.created_at).all()
    
    return messages


@router.post("/{link_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    link_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message in a link chat."""
    check_link_access(link_id, current_user, db)
    
    message = Message(
        link_id=link_id,
        sender_id=current_user.id,
        content=data.content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message

