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


class NotAuthenticatedException(AppException):
    status_code = 401
    detail = "Not authenticated"


class InsufficientPermissionsException(AppException):
    status_code = 403
    detail = "You do not have permission to perform this action"


class AccountDeactivatedException(AppException):
    status_code = 403
    detail = "Account is deactivated. Please contact support."


class CategoryNotFoundException(AppException):
    status_code = 404
    detail = "Category not found"


class ProductNotFoundException(AppException):
    status_code = 404
    detail = "Product not found"


class CompanyNotFoundException(AppException):
    status_code = 404
    detail = "No active company is registered with this NIP"


class AlreadyInCompanyException(AppException):
    status_code = 400
    detail = "You are already assigned to a company"


class DuplicateCompanyRequestException(AppException):
    status_code = 409
    detail = "You already have a pending join request"


class CompanyRequestNotFoundException(AppException):
    status_code = 404
    detail = "Join request not found"


class RequestAlreadyReviewedException(AppException):
    status_code = 409
    detail = "This request has already been reviewed"


class CannotRemoveSelfException(AppException):
    status_code = 400
    detail = "You cannot remove yourself from the company"


class NotInCompanyException(AppException):
    status_code = 400
    detail = "You are not assigned to any company"


class LastCompanyAdminException(AppException):
    status_code = 409
    detail = "You are the only company admin. Assign the company admin role to another member before leaving the company."
