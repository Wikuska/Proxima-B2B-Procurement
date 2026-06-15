class AppException(Exception):
    status_code: int = 400
    detail: str = "Application error"

    def __init__(self, detail: str | None = None, status_code: int | None = None):
        if detail:
            self.detail = detail
        if status_code:
            self.status_code = status_code


class ExpiredTokenException(AppException):
    status_code = 401
    detail = "Token has expired"


class InvalidTokenException(AppException):
    status_code = 401
    detail = "Invalid token"


class InvalidTokenTypeException(AppException):
    status_code = 401
    detail = "Invalid token type"


class EmailAlreadyExistsException(AppException):
    status_code = 400
    detail = "A user with this email already exists"


class InvalidCredentialsException(AppException):
    status_code = 401
    detail = "Invalid email or password"


class EmailNotVerifiedException(AppException):
    status_code = 403
    detail = "Email not verified. Please check your inbox."


class UserNotFoundException(AppException):
    status_code = 404
    detail = "User not found"
