from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password_plain: str, hashed_password: str) -> bool:
    return password_hash.verify(password_plain, hashed_password)


def hash_refresh_token(token: str) -> str:
    return password_hash.hash(token)


def verify_refresh_token(token: str, token_hash: str) -> bool:
    return password_hash.verify(token, token_hash)
