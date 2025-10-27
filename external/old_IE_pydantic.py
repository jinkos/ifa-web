# python
from __future__ import annotations

from typing import List, Optional, Annotated, Literal
from pydantic import BaseModel, Field, ConfigDict

from .PBS_pydantic import CashFlow, PersonalBalanceSheetItem

Age = Annotated[int, Field(ge=0, le=120, description='Age in years')]

EmploymentStatus = Literal[
    'employed',
    'self_employed',
    'retired',
    'full_time_education',
    'independent_means',
    'homemaker',
    'other',
]

class IEModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
        populate_by_name=True,
        str_strip_whitespace=True,
    )

# Main person model
class PersonSummary(IEModel):
    # Retirement and goals
    target_retirement_age: Optional[Age] = Field(default=None)
    target_retirement_income: Optional[CashFlow] = Field(default=None, description="Amount in today's money")

    # Work
    employment_status: Optional[EmploymentStatus] = Field(default=None)
    occupation: Optional[str] = Field(default=None, max_length=80)

    # Financials
    balance_sheet: List[PersonalBalanceSheetItem] = Field(default_factory=list, description='List of personal assets, liabilities, incomes and expenses')
