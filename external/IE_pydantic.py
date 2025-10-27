from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

# Enums for various statuses and types


class DebtType(str, Enum):
    mortgage = "mortgage"
    credit_card = "credit_card"
    personal_loan = "personal_loan"
    student_loan = "student_loan"
    auto_loan = "auto_loan"
    other = "other"

class SavingType(str, Enum):
    isa = "isa"
    savings_account = "savings_account"
    premium_bonds = "premium_bonds"
    current_account = "current_account"
    deposit_fixed_term = "deposit_fixed_term"
    general_investment_account = "general_investment_account"
    other = "other"

class PensionTypes(str, Enum):
    defined_benefit = "defined_benefit"
    workplace = "workplace"
    personal = "personal"
    sipp = "sipp"
    ssas = "ssas"
    state = "state"
    other = "other"

class InsurancePolicyType(str, Enum):
    life = "life"
    critical_illness = "critical_illness"
    income_protection = "income_protection"
    whole_of_life = "whole_of_life"
    other = "other"

class PropertyType(str, Enum):
    principal_residence = "principal_residence"
    second_home = "second_home"
    buy_to_let = "buy_to_let"
    other = "other"

class FrequencyType(str, Enum):
    weekly = "weekly"
    monthly = "monthly"
    quarterly = "quarterly"
    annually = "annually"

# Shared models
class CashflowItem(BaseModel):
    description: Optional[str] = Field(..., description="e.g., 'salary', 'rent', 'groceries'")
    inflow: Optional[bool] = Field(..., description="True if income, False if expense")
    amount: Optional[float] = Field(..., description="amount per frequency")
    currency: Optional[str] = Field("GBP", description="ISO 4217, e.g., 'GBP'")
    frequency: Optional[FrequencyType] = Field(..., description="e.g., 'monthly', 'annually', 'weekly'")
    is_gross: Optional[bool] = Field(True, description="True if gross (pre-tax), False if net (post-tax)")

class ValueWithCurrency(BaseModel):
    description: Optional[str] = Field(..., description="e.g., House, Pension with NHS, Mortgage borrowing")
    amount: float
    currency: str = Field("GBP", description="ISO 4217, e.g., 'USD'")

# Holdings and policies
class InvestmentHolding(BaseModel):
    description: Optional[str] = Field(..., description="e.g., 'Vanguard S&P 500 ETF', 'Bitcoin on Coinbase'")
    type: Optional[SavingType] = None
    value: Optional[ValueWithCurrency] = None
    contribution: Optional[CashflowItem] = None

class PensionHolding(BaseModel):
    description: Optional[str] = Field(..., description="e.g., 'Workplace pension with Aviva'")
    type: Optional[PensionTypes] = None
    value: Optional[ValueWithCurrency] = None
    contribution: Optional[CashflowItem] = None

class DebtHolding(BaseModel):
    description: Optional[str] = Field(..., description="e.g., 'Mortgage with Lloyds'")
    type: Optional[DebtType] = None
    balance: Optional[ValueWithCurrency] = None
    repayment: Optional[CashflowItem] = None

class InsurancePolicy(BaseModel):
    description: Optional[str] = Field(..., description="e.g., 'Life insurance with Legal & General'")
    type: Optional[InsurancePolicyType] = None
    coverage_amount: Optional[ValueWithCurrency] = None
    premium: Optional[CashflowItem] = None

class PropertyHolding(BaseModel):
    description: Optional[str] = Field(..., description="e.g., '123 Main St, Springfield'")
    type: Optional[PropertyType] = None
    value: Optional[ValueWithCurrency] = None
    rental_income: Optional[CashflowItem] = None
    expenses: Optional[List[CashflowItem]] = None

class EmploymentStatus(str, Enum):
    employed = "employed"
    self_employed = "self_employed"
    retried = "retried"
    full_time_education = "full_time_education"
    independent_means = "independent_means"
    homemaker = "homemaker"
    other = "other"


# Main person model
class PersonSummary(BaseModel):


    # Retirement and Goals
    target_retirement_age: Optional[int] = None
    target_retirement_income: Optional[CashflowItem] = Field(None, description="Amount in today's money")

    # Work
    employment_status: Optional[EmploymentStatus] = None
    occupation: Optional[str] = None

    # Financials
    current_income: List[CashflowItem] = Field(default_factory=list)
    current_expenses: List[CashflowItem] = Field(default_factory=list)
    savings_or_investments: List[InvestmentHolding] = Field(default_factory=list)
    pension_holdings: List[PensionHolding] = Field(default_factory=list)
    debt_holdings: List[DebtHolding] = Field(default_factory=list)
    insurance_policies: List[InsurancePolicy] = Field(default_factory=list)
