from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field2


class Gender(str, Enum):
    male = "male"
    female = "female"
    other = "other"
    undisclosed = "undisclosed"


class EmploymentStatus(str, Enum):
    employed = "employed"
    self_employed = "self_employed"
    retried = "retried"
    full_time_education = "full_time_education"
    independent_means = "independent_means"
    homemaker = "homemaker"
    other = "other"


class IdentityModel(BaseModel):

    # Address
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

    # Demographics
    date_of_birth: Optional[str] = None  # ISO date string YYYY-MM-DD
    gender: Optional[Gender] = None
    nationality: Optional[str] = None
    nationality2: Optional[str] = None

    # Work
    employment_status: Optional[EmploymentStatus] = None
    occupation: Optional[str] = None

