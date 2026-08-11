from enum import StrEnum


class UserRole(StrEnum):
    LEARNER = "learner"
    FACILITATOR = "facilitator"
    ADMIN = "admin"


class Gender(StrEnum):
    MALE = "male"
    FEMALE = "female"
