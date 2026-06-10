from decimal import Decimal

from app.database import SessionLocal
from app.models.company import Company
from sqlalchemy.orm import Session


def seed_data():
    print("Startup seeding data...")
    db: Session = SessionLocal()

    try:
        existing_companies = db.query(Company).first()
        if existing_companies:
            print("Data already exists.")
            return

        companies_to_add = [
            Company(
                name="Siemens Sp. z o.o.",
                nip="5210002341",
                discount_percentage=Decimal("15.00"),
                email_domain="siemens.com",
            ),
            Company(
                name="Budimex S.A.",
                nip="5260039521",
                discount_percentage=Decimal("10.00"),
                email_domain="budimex.pl",
            ),
            Company(
                name="Januszex i Synowie",
                nip="1234567890",
                discount_percentage=Decimal("5.00"),
                email_domain=None,
            ),
        ]

        db.add_all(companies_to_add)
        db.commit()
        print("Successfully added test companies to the database!")

    except Exception as e:
        db.rollback()
        print(f"Error occured during seeding: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
