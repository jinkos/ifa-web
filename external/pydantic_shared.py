#################################################################
# Shared Pydantic Models and Types for Financial and Demographic Data
# version 2
#
# Summary (v2):
# - Centralizes common literals, enums, and small value-objects (CashFlow, Debt)
#   used by both Identity and Balance Sheet models.
# - Establishes a strict BaseModel (LLMModel) with extra='forbid' and
#   normalized string handling so downstream JSON is predictable.
# - Use these shared types in feature models (identity/balance) to keep
#   a single source of truth for constraints and JSON schema.
#
# Migration tips:
# - Prefer importing from this module rather than redefining literals/enums.
# - When evolving schemas, add/adjust here first so feature models stay in sync.
#################################################################

from enum import Enum
from decimal import Decimal
from typing import Annotated, Optional, Literal, Union, List
from pydantic import BaseModel, Field, ConfigDict

### LITERALS AND ENUMS ###

class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    undisclosed = "undisclosed"

class HealthStatus(str, Enum):
    good = "good"
    some_problems = "some_problems"
    mostly_good = "mostly_good"
    serious_problems = "serious_problems"

class MaritalStatus(str, Enum):
    single = "single"
    married = "married"
    civil_partnership = "civil_partnership"
    divorced = "divorced"
    widowed = "widowed"
    separated = "separated"
    cohabiting = "cohabiting"
    other = "other"

class YesNoUnknown(str, Enum):
    yes = "yes"
    no = "no"
    unknown = "unknown"

EmploymentStatus = Literal[
    'employed',
    'self_employed',
    'retired',
    'full_time_education',
    'independent_means',
    'homemaker',
    'other',
]

# Flat literals (simpler JSON Schema than Enums)
Frequency = Literal['weekly', 'monthly', 'quarterly', 'six_monthly', 'annually', 'unknown']
NetGross = Literal['net', 'gross', 'unknown']
ItemType = Literal[
    'salary_income',
    'side_hustle_income',
    'self_employment_income',
    'expenses',
    'buy_to_let',
    'current_account',
    'gia',
    'isa',
    'premium_bond',
    'savings_account',
    'uni_fees_savings_plan',
    'vct',
    'credit_card',
    'personal_loan',
    'student_loan',
    'main_residence',
    'holiday_home',
    'other_valuable_item',
    'workplace_pension',
    'defined_benefit_pension',
    'personal_pension',
    'state_pension',
    'annuity_pension',
    'collectable',
    'deposit_account',
    'eis',
    'IHT_scheme',
    'life_insurance',
    'sipp',
    'whole_of_life_policy',
]

Age = Annotated[int, Field(ge=0, le=120, description='Age in years')]

# Strict base to keep outputs clean and predictable
class LLMModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
        populate_by_name=True,
        str_strip_whitespace=True,
    )

class CashFlow(LLMModel):
    periodic_amount: Optional[int]
    frequency: Frequency = Field(default='monthly')
    net_gross: NetGross = Field(default='unknown')


class Debt(LLMModel):
    balance: Optional[int]
    repayment: Optional[CashFlow] = None
