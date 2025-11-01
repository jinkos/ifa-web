###############################################
# Old Models for personal balance sheet
# version 1
###############################################

from __future__ import annotations
import pprint

from typing import List, Optional, Annotated, Literal
from pydantic import BaseModel, Field, ConfigDict

# from .PBS_pydantic import CashFlow, PersonalBalanceSheetItem
from src.data.PBS_pydantic import CashFlow, BSItem

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
    # Retirement goals
    target_retirement_age: Optional[Age] = Field(default=None)
    target_retirement_income: Optional[CashFlow] = Field(default=None, description="Amount in today's money")

    # Work
    employment_status: Optional[EmploymentStatus] = Field(default=None)
    occupation: Optional[str] = Field(default=None, max_length=80)

    # Financials
    balance_sheet: List[BSItem] = Field(default_factory=list, description='List of personal assets, liabilities, incomes and expenses')

if __name__ == "__main__":

    from src.utils.token_counter import pydantic_token_counter

    # print the JSON schema
    pprint.pprint(PersonSummary.model_json_schema())
    count = pydantic_token_counter(PersonSummary)
    print(f"PersonSummary token count: {count}")