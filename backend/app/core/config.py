from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .constants import ACCESS_TOKEN_EXPIRE_MINUTES


class Settings(BaseSettings):

    # Database Config
    db_host: str = Field(alias="DB_HOST")
    db_port: int = Field(alias="DB_PORT")
    db_user: str = Field(alias="DB_USER")
    db_pass: str = Field(alias="DB_PASSWORD")
    db_name: str = Field(alias="DB_NAME")

    # JWT Config
    access_token_secret_key: str = Field(alias="ACCESS_TOKEN_SECRET_KEY")
    refresh_token_secret_key: str = Field(alias="REFRESH_TOKEN_SECRET_KEY")
    access_token_expire_minutes: int = Field(
        default=ACCESS_TOKEN_EXPIRE_MINUTES, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    """ CORS Config """
    cors_origins: str = Field(
        default="http://localhost:5173", alias="CORS_ORIGINS"
    )
    # Backblaze Config
    # Optional: only required for the file-storage feature (see app/storage.py).
    # Unset locally, boto3 client construction still succeeds; only actual
    # upload/download calls against B2 would fail.
    b2_key_id: str = Field(alias="B2_KEY_ID")
    b2_application_key: str = Field(alias="B2_APPLICATION_KEY")
    b2_endpoint_url: str = Field(alias="B2_ENDPOINT_URL")
    b2_bucket_name: str = Field(alias="B2_BUCKET_NAME")

    # EEG Stimulus
    eeg_stimulus_file_key: str = Field(alias="EEG_STIMULUS_FILE_KEY")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    @property
    def db_url(self) -> str:
        return (
            f"postgresql+psycopg://"
            f"{self.db_user}:{self.db_pass}"
            f"@{self.db_host}:{self.db_port}"
            f"/{self.db_name}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
    