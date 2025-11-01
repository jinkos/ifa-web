###############################################
# Models for personal balance sheet items and personal balance sheet
# version 2
# uses shared pydantic types from pydantic_shared.py
#
# Summary (v2):
# - BalanceSheetModel is now only a list of BSItem (no retirement or work fields).
# - Financial inventory (assets, liabilities, incomes, expenses) is kept here;
#   demographic and retirement/work details live in IdentityModel.
# - Item subtypes (Income, Investment, Property, etc.) derive from LLMModel for
#   consistent JSON normalization (extra='forbid', trimmed strings).
#
# API/UI migration note:
# - Frontend that previously read target_retirement_age/income from balance should
#   switch to identity. Balance API should return only items.
###############################################


from __future__ import annotations

import pprint
from typing import Optional, List
from pydantic import BaseModel, Field

# Prefer server path; fall back to local copy when used standalone in this repo
try:
    from src.data.pydantic_shared import (
        LLMModel,
        CashFlow,
        Debt,
        ItemType,
    )
except Exception:  # pragma: no cover - dev/demo fallback
    from .pydantic_shared import (
        LLMModel,
        CashFlow,
        Debt,
        ItemType,
    )


# INCOME
class Income(LLMModel):
    income: CashFlow = Field(description='Regular income cash flow')


# Expenses
class Expenses(LLMModel):
    expenditure: CashFlow = Field(description='Regular expenditure')


# INVESTMENTS
class BuyToLet(LLMModel):
    rental_income: CashFlow = Field(description='Regular rental income from the property')
    property_value: Optional[int]
    loan: Optional[Debt] = None


class Investment(LLMModel):
    contribution: Optional[CashFlow] = Field(None, description='Regular contribution to the investment')
    income: Optional[CashFlow] = Field(None, description='Regular income from the investment')
    investment_value: Optional[int]


# LOANS
class Loan(LLMModel):
    balance: Optional[int]
    repayment: Optional[CashFlow] = None


# PROPERTIES
class Property(LLMModel):
    value: Optional[int]
    loan: Optional[Debt] = None


# PENSIONS
class NonStatePension(Investment):
    employer_contribution: Optional[CashFlow] = None


class StatePension(BaseModel):
    pension: CashFlow = Field(description='Expected state pension cash flow')


# GLOBALS
class BSItem(BaseModel):
    iid: Optional[int] = Field(default=None, description='Item identifier (small integer), unique within the balance sheet. LLM may reuse iid from prior versions of the balance sheet to help with deduplication. Otherwise leave as null.')
    type: ItemType = Field(description='Discriminator for the item kind')
    description: str = Field(description='User-provided description of the item or a grammatical version of the ItemType')
    currency: str = Field(default='GBP', description='ISO 4217 currency code')
    ite: Income | Expenses | BuyToLet| Investment | Loan | Property | NonStatePension | StatePension

class BalanceSheetModel(LLMModel):
    balance_sheet: List[BSItem] = Field(default_factory=list, description='List of personal assets, liabilities, incomes and expenses')



if __name__ == "__main__":

    from src.utils.token_counter import pydantic_token_counter

    # print the JSON schema
    pprint.pprint(BalanceSheetModel.model_json_schema())
    count = pydantic_token_counter(BalanceSheetModel)
    print(f"BalanceSheetModel token count: {count}")