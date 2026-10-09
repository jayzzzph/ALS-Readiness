import logging
from uuid import uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings
from app.core.exceptions import StorageUnavailableError

logger = logging.getLogger(__name__)

# Everything a storage call can raise. ClientError is an error response from
# B2; BotoCoreError covers failures before a response exists: missing
# credentials, an unreachable endpoint, a timeout, invalid parameters.
STORAGE_ERRORS = (BotoCoreError, ClientError)

# Log the "B2 not configured" warning once, not once per asset.
_warned_unconfigured = False

s3_client = boto3.client(
    "s3",
    endpoint_url=settings.b2_endpoint_url,
    aws_access_key_id=settings.b2_key_id,
    aws_secret_access_key=settings.b2_application_key,
    config=Config(signature_version="s3v4"),
    region_name="us-west-004"
)


def build_key(folder: str, filename: str) -> str:
    """Build a unique object key within a given folder prefix."""
    return f"{folder}/{uuid4()}_{"_".join(filename.lower().split())}"


def file_exists(key: str) -> bool:
    """Check whether an object exists at the given key in B2."""
    _require_configured()
    try:
        s3_client.head_object(Bucket=settings.b2_bucket_name, Key=key)
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code in ("404", "NoSuchKey"):
            return False
        raise


def get_upload_url(
    key: str,
    content_type: str = "text/csv",
    expires_in: int = 7200,
) -> str:
    """Generate a presigned URL for uploading a file."""
    _require_configured()
    return s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.b2_bucket_name,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def _b2_is_configured() -> bool:
    """Whether every B2 setting needed to build a URL is present.

    The B2 settings are optional so the app can start without credentials, so
    anything that builds a URL must cope with them being absent. Placeholder
    values count as configured: they build a well-formed (if unusable) URL.
    """
    return all(
        (
            settings.b2_key_id,
            settings.b2_application_key,
            settings.b2_endpoint_url,
            settings.b2_bucket_name,
        )
    )


def _require_configured() -> None:
    """Every storage call starts here. With any of the four B2 settings missing
    or empty there is no storage to call, so it stops with the same
    StorageUnavailableError as a storage that cannot be reached. Without this,
    boto3 fails on the missing value with errors of its own (a TypeError for a
    missing bucket name) that nothing downstream treats as a storage failure.
    """
    global _warned_unconfigured

    if _b2_is_configured():
        return

    if not _warned_unconfigured:
        _warned_unconfigured = True
        logger.warning(
            "B2 storage is not fully configured (B2_KEY_ID, B2_APPLICATION_KEY, "
            "B2_ENDPOINT_URL, B2_BUCKET_NAME); uploads answer 503 and file links are omitted."
        )
    raise StorageUnavailableError()


def get_read_url(key: str, expires_in: int = 7200) -> str:
    """Generate a presigned URL for reading/viewing a file.

    Raises StorageUnavailableError when B2 isn't configured. Callers that only
    show a link catch it and degrade (omit the image or the link) instead of
    failing the whole view.
    """
    _require_configured()

    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.b2_bucket_name, "Key": key},
        ExpiresIn=expires_in,
    )


def upload_file(local_path: str, key: str, content_type: str | None = None):
    """Upload a local file to Backblaze B2."""
    _require_configured()
    extra_args = {"ContentType": content_type} if content_type else {}
    
    s3_client.upload_file(
        Filename=local_path,
        Bucket=settings.b2_bucket_name,
        Key=key,
        ExtraArgs=extra_args,
    )
