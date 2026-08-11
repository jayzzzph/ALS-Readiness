from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    """ Database Config """
    db_host: str = Field(alias="DB_HOST")
    db_port: int = Field(alias="DB_PORT")
    db_user: str = Field(alias="DB_USER")
    db_pass: str = Field(alias="DB_PASSWORD")
    db_name: str = Field(alias="DB_NAME")

    """ JWT Config """
    access_token_secret_key: str = Field(alias="ACCESS_TOKEN_SECRET_KEY")
    refresh_token_secret_key: str = Field(alias="REFRESH_TOKEN_SECRET_KEY")

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


settings = Settings()
    