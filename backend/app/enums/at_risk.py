from enum import StrEnum


class AtRiskReason(StrEnum):
    LOW_MPS = "low_mps"
    INACTIVE = "inactive"
    LOW_READINESS = "low_readiness"


# How a reason reads to a person, for exports. The API itself sends the values above.
AT_RISK_REASON_LABELS: dict[AtRiskReason, str] = {
    AtRiskReason.LOW_MPS: "Low test score",
    AtRiskReason.INACTIVE: "Inactive",
    AtRiskReason.LOW_READINESS: "Low readiness",
}


class AtRiskFlagStatus(StrEnum):
    OPEN = "open"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    RESOLVED = "resolved"


# A flag still counts against the learner in these states.
ACTIVE_FLAG_STATUSES = (AtRiskFlagStatus.OPEN, AtRiskFlagStatus.REVIEWED)
