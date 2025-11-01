#####################################################
# model for Identity information
# version 2
# uses shared pydantic types from pydantic_shared.py
#
# Summary (v2):
# - Identity now owns retirement goals and work info
#   (target_retirement_age, target_retirement_income, employment_status, occupation).
# - These fields were previously part of a combined person summary under balance.
# - Keep demographic/person data here; financial inventory (items) lives in Balance.
#
# UI/API migration note:
# - Frontend pages that previously read retirement/work from the balance endpoint
#   should switch to the identity endpoint.
######################################################

from .pydantic_shared import (
    Gender,
    MaritalStatus,
    HealthStatus,
    YesNoUnknown,
    Age,
    CashFlow,
    EmploymentStatus,
)
# Explicit imports for base/typing not re-exported by pydantic_shared
from typing import Optional
from pydantic import BaseModel, Field

class IdentityModel(BaseModel):

    # Personal Information
    date_of_birth: Optional[str] = None  # ISO date string YYYY-MM-DD
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None

    # Residential Address
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None

    # Health and Lifestyle
    health_status: Optional[HealthStatus] = None
    smoker: Optional[YesNoUnknown] = YesNoUnknown.unknown

    # National Identity
    nationality: Optional[str] = None
    nationality2: Optional[str] = None
    n_i_number: Optional[str] = None  # National Insurance Number

    # Retirement and goals
    target_retirement_age: Optional[Age] = Field(default=None)
    target_retirement_income: Optional[CashFlow] = Field(default=None, description="Amount in today's money")

    # Work
    employment_status: Optional[EmploymentStatus] = Field(default=None)
    occupation: Optional[str] = Field(default=None, max_length=80)
