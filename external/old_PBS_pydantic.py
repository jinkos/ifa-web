###############################################
# Old Models for personal balance sheet items
# version 1
###############################################

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional, Literal, Union, List
from pydantic import BaseModel, Field, ConfigDict

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
    'car',
    'workplace_pension',
    'defined_benefit_pension',
    'personal_pension',
    'state_pension',
]

# Strict base to keep outputs clean and predictable
class PBSModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class CashFlow(PBSModel):
    periodic_amount: Optional[int]
    frequency: Frequency = Field(default='monthly')
    net_gross: NetGross = Field(default='unknown')


class Debt(PBSModel):
    balance: Optional[int]
    repayment: Optional[CashFlow] = None


# INCOME
class Income(BaseModel):
    income: CashFlow = Field(description='Regular income cash flow')

# Expenses
class Expenses(BaseModel):
    expenditure: CashFlow = Field(description='Regular expenditure')


# INVESTMENTS
class BuyToLet(BaseModel):
    rental_income: CashFlow = Field(description='Regular rental income from the property')
    property_value: Optional[int]
    loan: Optional[Debt] = None

class Investment(PBSModel):
    contribution: Optional[CashFlow] = Field(None, description='Regular contribution to the investment')
    income: Optional[CashFlow] = Field(None, description='Regular income from the investment')
    investment_value: Optional[int]

# LOANS
class Loan(BaseModel):
    balance: Optional[int]
    repayment: Optional[CashFlow] = None


# PROPERTIES
class Property(BaseModel):
    value: Optional[int]
    loan: Optional[Debt] = None


# PENSIONS
class NonStatePension(Investment):
    employer_contribution: Optional[CashFlow] = None

class StatePension(BaseModel):
    pension: CashFlow = Field(description='Expected state pension cash flow')


class BSItem(BaseModel):
    type: ItemType = Field(description='Discriminator for the item kind')
    description: Optional[str] = None
    currency: str = Field(default='GBP', description='ISO 4217 currency code')
    ite: Income | Expenses | BuyToLet| Investment | Loan | Property | NonStatePension | StatePension
