from datetime import timedelta

# JWT
SIGNING_ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
REFRESH_TOKEN_EXPIRE_DAYS: int = 30

# Password Hash
DUMMY_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$KsrCCT7vUAgxfbagUoFmww$QnzEmwXZ+dUQKZXgelfEoyvY5oTnLoMA8fDa1XeMd5E"

# Password applied when an admin resets a Learner/Facilitator password. The
# account is flagged must_change_password, so it only lives until first login.
DEFAULT_RESET_PASSWORD = "alsENSE@2026!"

# At-risk rules (D14). The two thresholds follow DepEd practice and are
# provisional, pending confirmation from the ALS coordinator.
# A posttest MPS strictly below this is flagged.
AT_RISK_MPS_THRESHOLD = 75
# This many whole days without activity, or more, is flagged.
AT_RISK_INACTIVITY_DAYS = 5
# Off until M03 provides readiness (D1).
AT_RISK_READINESS_ENABLED = False
# Inactive days are counted on the Manila calendar. The Philippines has no
# daylight saving, so a fixed offset from UTC is exact.
MANILA_UTC_OFFSET = timedelta(hours=8)
