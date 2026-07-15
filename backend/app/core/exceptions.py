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


class ProductUnavailableException(AppException):
    status_code = 400
    detail = "This product is not available"


class B2BRestrictedException(AppException):
    status_code = 403
    detail = "This product is available to company accounts only"


class InsufficientStockException(AppException):
    status_code = 400
    detail = "Requested quantity exceeds available stock"


class EmptyOrderException(AppException):
    status_code = 400
    detail = "No eligible cart items selected for this order"


class AddressNotFoundException(AppException):
    status_code = 404
    detail = "Address not found"


class InvalidShippingAddressException(AppException):
    status_code = 400
    detail = "The selected address does not match the order type"


class InvoiceRequiresCompanyException(AppException):
    status_code = 400
    detail = "An invoice purchase requires a company account"


class OrderNotFoundException(AppException):
    status_code = 404
    detail = "Order not found"


class InvalidBillingDataException(AppException):
    status_code = 400
    detail = "Missing required fields for the selected document type"


class CompanyBillingAddressMissingException(AppException):
    status_code = 400
    detail = "Company has no billing address configured. Contact your company admin."


class DuplicateBillingAddressException(AppException):
    status_code = 409
    detail = "Company already has a billing address. Delete the existing one first."


class CannotDeleteBillingAddressException(AppException):
    status_code = 400
    detail = "The billing address cannot be deleted — edit it instead."


class InvalidPaymentMethodException(AppException):
    status_code = 400
    detail = "This payment method is not available for the selected purchase type"


class InvalidOrderStatusTransitionException(AppException):
    status_code = 400
    detail = "This order status transition is not allowed"


class PaymentActionNotAllowedException(AppException):
    status_code = 400
    detail = "This payment action is not allowed for the current order"


class InvalidVerificationCodeException(AppException):
    status_code = 400
    detail = "Invalid verification code"

    def __init__(self, attempts_left: int | None = None):
        if attempts_left is not None:
            super().__init__(
                detail=f"Invalid verification code. {attempts_left} attempt(s) remaining."
            )
        else:
            super().__init__()


class ExpiredVerificationCodeException(AppException):
    status_code = 401
    detail = "Verification code has expired. Please check your email for a new code."


class TooManyVerificationAttemptsException(AppException):
    status_code = 429
    detail = "Too many failed attempts. Please request a new verification code."


class ResendCooldownException(AppException):
    status_code = 429
    detail = "Please wait before requesting another code."

    def __init__(self, retry_after_seconds: int):
        super().__init__(
            detail=f"Please wait {retry_after_seconds} second(s) before requesting another code."
        )


class VerificationInProgressException(AppException):
    status_code = 409
    detail = "Verification already in progress. Please wait a moment."
