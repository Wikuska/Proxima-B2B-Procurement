import enum


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    COMPANY_ADMIN = "COMPANY_ADMIN"
    ADMIN = "ADMIN"


class PurchaseType(str, enum.Enum):
    B2B = "B2B"
    B2C = "B2C"


class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PREPARING = "PREPARING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"


class DocumentType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    PERSONAL_INVOICE = "PERSONAL_INVOICE"
    COMPANY_INVOICE = "COMPANY_INVOICE"


class AddressType(str, enum.Enum):
    SHIPPING = "SHIPPING"
    BILLING = "BILLING"


class DeliveryMethod(str, enum.Enum):
    COURIER = "COURIER"
    COURIER_EXPRESS = "COURIER_EXPRESS"
    INPOST_LOCKER = "INPOST_LOCKER"
    PICKUP = "PICKUP"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    CARD = "CARD"
    BLIK = "BLIK"
    CASH_ON_DELIVERY = "CASH_ON_DELIVERY"
    DEFERRED = "DEFERRED"


class ProductSortBy(str, enum.Enum):
    RELEVANCE = "relevance"
    NAME_ASC = "name_asc"
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
