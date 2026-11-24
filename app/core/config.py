from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str = Field(
        ...,
        validation_alias= AliasChoices(
            "supabase_url",
            "SUPABASE_URL"
        )
    )
    supabase_key: str = Field(
        ...,
        validation_alias= AliasChoices(
            "supabase_key",
            "SUPABASE_KEY",
            "supabase_secret_key",
            "SUPABASE_SECRET_KEY"
        )
    )
    jwt_secret: str = Field(
        ...,
        validation_alias= AliasChoices(
            "jwt_secret",
            "JWT_SECRET"
        )
    )
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = Field(
        default=60,
        validation_alias= AliasChoices(
            "access_token_minutes",
            "ACCESS_TOKEN_MINUTES",
            "access_tokn_minutes"
        )
    )
    allowed_origins: str = Field(
        default="",
        validation_alias= AliasChoices(
            "allowed_origins",
            "ALLOWED_ORIGINS"
        )
    )

    @property
    def access_tokn_minutes(self) -> int:
        return self.access_token_minutes
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
setting = settings