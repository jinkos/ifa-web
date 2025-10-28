from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional, Literal, Union, List
from pydantic import BaseModel, Field, ConfigDict

# Flat literals (simpler JSON Schema than Enums)
Frequency = Literal['weekly', 'monthly', 'quarterly', 'six_monthly', 'annually', 'unknown']
NetGross = Literal['net', 'gross', 'unknown']

# Reusable constrained types
CurrencyCode = Annotated[str, Field(pattern='^[A-Z]{3}$', description='ISO 4217 currency code')]
Money = Annotated[Decimal, Field(ge=0, description='Non-negative monetary value')]
PeriodicAmount = Annotated[Decimal, Field(gt=0, description='Positive amount per frequency')]

# Helper "macros" to keep field declarations concise
def money_field(default: Optional[Decimal] = None, description: str = 'Non-negative monetary value'):
    return Field(default=default, ge=0, description=description)

def currency_field(default: str = 'GBP', description: str = 'ISO 4217 currency code'):
    return Field(default=default, pattern='^[A-Z]{3}$', description=description)

# Strict base to keep outputs clean and predictable
class PBSModel(BaseModel):
    model_config = ConfigDict(
        extra='forbid',
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class CashFlow(PBSModel):
    amount: PeriodicAmount
    frequency: Frequency = Field(default='monthly')
    net_gross: NetGross = Field(default='unknown')


class Debt(PBSModel):
    balance: Optional[Money] = money_field()
    repayment: Optional[CashFlow] = None


class Property(PBSModel):
    value: Optional[Money] = money_field()
    loan: Optional[Debt] = None


class ContributionInvestment(PBSModel):
    contribution: Optional[CashFlow] = None
    income: Optional[CashFlow] = None
    value: Optional[Money] = money_field(description='Current investment value')


class PBSItemBase(PBSModel):
    type: str = Field(description='Discriminator for the item kind')
    description: Optional[str] = None
    currency: CurrencyCode = currency_field()


# INCOME
class SalaryIncome(PBSItemBase):
    type: Literal['salary_income'] = 'salary_income'
    description: Optional[str] = Field(default='Salary')
    income: CashFlow


class SideHustleIncome(PBSItemBase):
    type: Literal['side_hustle_income'] = 'side_hustle_income'
    description: Optional[str] = Field(default='Side Hustle')
    profit: CashFlow


class SelfEmploymentIncome(PBSItemBase):
    type: Literal['self_employment_income'] = 'self_employment_income'
    description: Optional[str] = Field(default='Self Employment')
    drawings: CashFlow


# INVESTMENTS
class BuyToLet(PBSItemBase):
    type: Literal['buy_to_let'] = 'buy_to_let'
    description: Optional[str] = Field(default='Buy to Let')
    value: Optional[Money] = money_field()
    rental_income: Optional[CashFlow] = None
    mortgage: Optional[Debt] = None


class CurrentAccount(PBSItemBase):
    type: Literal['current_account'] = 'current_account'
    description: Optional[str] = Field(default='Current Account')
    value: Optional[Money] = money_field()
    interest_income: Optional[CashFlow] = None


class GeneralInvestmentAccount(PBSItemBase):
    type: Literal['gia'] = 'gia'
    description: Optional[str] = Field(default='General Investment Account')
    investment: Optional[ContributionInvestment] = None


class ISA(PBSItemBase):
    type: Literal['isa'] = 'isa'
    description: Optional[str] = Field(default='ISA')
    investment: Optional[ContributionInvestment] = None


class PremiumBond(PBSItemBase):
    type: Literal['premium_bond'] = 'premium_bond'
    description: Optional[str] = Field(default='Premium Bond')
    investment: Optional[ContributionInvestment] = None


class SavingAccount(PBSItemBase):
    type: Literal['savings_account'] = 'savings_account'
    description: Optional[str] = Field(default='Saving Account')
    investment: Optional[ContributionInvestment] = None


class UniFeesSavingsPlan(PBSItemBase):
    type: Literal['uni_fees_savings_plan'] = 'uni_fees_savings_plan'
    description: Optional[str] = Field(default='Uni Fees Savings Plan')
    investment: Optional[ContributionInvestment] = None


class VentureCapitalTrust(PBSItemBase):
    type: Literal['vct'] = 'vct'
    description: Optional[str] = Field(default='Venture Capital Trust')
    value: Optional[Money] = money_field()
    dividend_income: Optional[CashFlow] = None


# LOANS
class CreditCard(PBSItemBase):
    type: Literal['credit_card'] = 'credit_card'
    description: Optional[str] = Field(default='Credit Card')
    value: Optional[Money] = money_field()
    repayment: Optional[CashFlow] = None


class PersonalLoan(PBSItemBase):
    type: Literal['personal_loan'] = 'personal_loan'
    description: Optional[str] = Field(default='Personal Loan')
    value: Optional[Money] = money_field()
    repayment: Optional[CashFlow] = None


class StudentLoan(PBSItemBase):
    type: Literal['student_loan'] = 'student_loan'
    description: Optional[str] = Field(default='Student Loan')
    value: Optional[Money] = money_field()
    repayment: Optional[CashFlow] = None


# PROPERTIES
class MainResidence(PBSItemBase):
    type: Literal['main_residence'] = 'main_residence'
    description: Optional[str] = Field(default='Main Residence')
    value: Optional[Money] = money_field()
    loan: Optional[Debt] = None


class HolidayHome(PBSItemBase):
    type: Literal['holiday_home'] = 'holiday_home'
    description: Optional[str] = Field(default='Holiday Home')
    value: Optional[Money] = money_field()
    loan: Optional[Debt] = None


class Car(PBSItemBase):
    type: Literal['car'] = 'car'
    description: Optional[str] = Field(default='Car')
    value: Optional[Money] = money_field()
    loan: Optional[Debt] = None


# PENSIONS
class WorkplacePension(PBSItemBase):
    type: Literal['workplace_pension'] = 'workplace_pension'
    description: Optional[str] = Field(default='Workplace Pension')
    investment: Optional[ContributionInvestment] = None
    employer_contribution: Optional[CashFlow] = None


class DefinedBenefitPension(PBSItemBase):
    type: Literal['defined_benefit_pension'] = 'defined_benefit_pension'
    description: Optional[str] = Field(default='Defined Benefit Pension')
    investment: Optional[ContributionInvestment] = None
    employer_contribution: Optional[CashFlow] = None


class PersonalPension(PBSItemBase):
    type: Literal['personal_pension'] = 'personal_pension'
    description: Optional[str] = Field(default='Personal Pension')
    investment: Optional[ContributionInvestment] = None
    employer_contribution: Optional[CashFlow] = None


# Discriminated union and container
PersonalBalanceSheetItem = Annotated[
    Union[
        SalaryIncome,
        SideHustleIncome,
        SelfEmploymentIncome,
        BuyToLet,
        CurrentAccount,
        GeneralInvestmentAccount,
        ISA,
        PremiumBond,
        SavingAccount,
        UniFeesSavingsPlan,
        VentureCapitalTrust,
        CreditCard,
        PersonalLoan,
        StudentLoan,
        MainResidence,
        HolidayHome,
        Car,
        WorkplacePension,
        DefinedBenefitPension,
        PersonalPension,
    ],
    Field(discriminator='type'),
]
