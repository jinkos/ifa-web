######################################################
# Pydantic models for API requests and responses
# version 2
#
# Summary (v2):
# - Introduces typed request/response models for FastAPI endpoints, including
#   shopping list, uploads (init/commit), document digest/extract/delete, Q&A,
#   and email. These are thin DTOs meant for the transport boundary.
# - Request shapes can embed domain models (IdentityModel, BalanceSheetModel),
#   which now live in separate identity/balance modules.
#
# Usage notes:
# - Keep these models focused on API I/O; domain logic remains in the domain
#   models and services. Prefer explicit fields and defaults suited to transport.
# - As domain versions evolve, add forward-compatible optional fields here.
######################################################

from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Optional, List
from datetime import datetime
# Prefer server path; fall back to local copy when used standalone in this repo
try:
    from src.data.pydantic_identity import IdentityModel
    from src.data.pydantic_balance import BalanceSheetModel, BSItem
except Exception:  # pragma: no cover - dev/demo fallback
    from .pydantic_identity import IdentityModel
    from .pydantic_balance import BalanceSheetModel, BSItem

class ShoppingItem(BaseModel):
    model_config = ConfigDict(
        extra='ignore',           # Ignore unexpected keys
        populate_by_name=True,    # Allow both alias and field name
        str_strip_whitespace=True
    )

    id: str
    # either a field (legacy) or a section key (preferred)
    field_id: Optional[str] = Field(default=None, alias='fieldId')
    section_key: Optional[str] = Field(default=None, alias='sectionKey')

    label: str
    section: Optional[str] = None
    path: Optional[str] = None

    created_at: datetime = Field(alias='createdAt')
    meta: Optional[dict[str, Any]] = None

class ShoppingEmailRequest(BaseModel):
    team_id: int
    client_id: int
    shopping_list: List[ShoppingItem] = Field(..., description="List of items to shop for")
    identity_model: Optional[IdentityModel] = None
    person_summary: Optional[BalanceSheetModel] = None

class ComposeEmailResponse(BaseModel):
    target_email: Optional[str] = None
    subject: Optional[str] = None
    email_body: str

    def __str__(self):
        return (f"To: {self.target_email}\n"
                f"Subject: {self.subject}"
                f"\n\n{self.email_body}")


class InitUploadRequest(BaseModel):
    team_id: int
    client_id: int
    document_name: str = Field(..., description="Filename to place under team_id/client_id/")
    content_type: Optional[str] = None


class InitUploadResponse(BaseModel):
    bucket: str
    storage_path: str
    signed_url: str
    token: str


class CommitRequest(BaseModel):
    team_id: int
    client_id: int
    storage_path: str
    document_name: Optional[str] = None
    content_type: Optional[str] = None
    sha256: Optional[str] = None


class DigestRequest(BaseModel):
    team_id: int
    client_id: int
    document_name: str

class CommitResponse(BaseModel):
    parent_id: str
    storage_path: str
    sha256: Optional[str] = None

class ExtractRequest(BaseModel):
    team_id: int
    client_id: int
    balance_sheet: Optional[List[BSItem]] = []

class DeleteResponse(BaseModel):
    deleted: bool
    parent_id: str
    storage_path: Optional[str] = None


class AskRequest(BaseModel):
    team_id: int
    client_id: int
    question: str
    k: int = 4
    max_context_chars: int | None = 8000
    model: str = "gpt-4o-mini"
    temperature: float = 0.0


class AskResponse(BaseModel):
    answer: str
    citations: list[dict]  # [{source, title, doc_id}]
    used_docs: int

class SendEmailRequest(BaseModel):
    team_id: int
    client_id: int
    to_email: str
    subject: str
    email_body: str

class SendEmailResponse(BaseModel):
    sent: bool
    message_id: Optional[str] = None

class ClientRequest(BaseModel):
    team_id: int
    client_id: int

class PlanningRequest(BaseModel):
    team_id: int
    client_id: int

class PlanningResponse(BaseModel):
    html_message: Optional[str] = None

