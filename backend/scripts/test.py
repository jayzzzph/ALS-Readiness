from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()

dummy_hash = password_hash.hash("some-random-dummy-password")

print(dummy_hash)
