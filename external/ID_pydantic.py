from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field2


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
    smoker: YesNoUnknown = YesNoUnknown.unknown

    # National Identity
    nationality: Optional[str] = None
    nationality2: Optional[str] = None
    n_i_number: Optional[str] = None  # National Insurance Number
