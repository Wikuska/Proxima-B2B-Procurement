"""
Proxima Lab Supply — Database Seed Script
Run from backend/ directory: python -m app.seeds.seed_catalog
"""

import asyncio
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app.database import AsyncSessionLocal
from app.models import (
    Address,
    AddressType,
    CartItem,
    Category,
    Company,
    CompanyRequest,
    Order,
    OrderItem,
    Product,
    ProductVolumeDiscount,
    User,
    UserRole,
)
from pwdlib import PasswordHash
from sqlalchemy import delete

# ── CATEGORIES ──────────────────────────────────────────────────────────────

CATEGORIES = [
    {
        "name": "Reagents & Chemicals",
        "slug": "reagents-chemicals",
        "description": "High-purity solvents, acids, bases, buffers, and indicators for laboratory use.",
    },
    {
        "name": "Lab Equipment",
        "slug": "lab-equipment",
        "description": "Centrifuges, hotplates, stirrers, microscopes, and other core laboratory instruments.",
    },
    {
        "name": "Glassware",
        "slug": "glassware",
        "description": "Borosilicate beakers, flasks, graduated cylinders, slides, and test tubes.",
    },
    {
        "name": "Consumables",
        "slug": "consumables",
        "description": "Disposable pipette tips, petri dishes, filters, syringes, and single-use items.",
    },
    {
        "name": "Measuring & Testing",
        "slug": "measuring-testing",
        "description": "Analytical balances, pH meters, thermometers, spectrophotometers, and calibration tools.",
    },
    {
        "name": "Safety Equipment",
        "slug": "safety-equipment",
        "description": "Personal protective equipment, spill kits, eyewash stations, and chemical disposal containers.",
    },
    {
        "name": "Lab Furniture",
        "slug": "lab-furniture",
        "description": "Laboratory benches, storage racks, fume hood cabinets, and ergonomic seating.",
    },
]


# ── PRODUCTS ─────────────────────────────────────────────────────────────────
# Format: (name, slug, sku, description, base_price, stock_quantity, is_b2b_only, main_image_url)

PRODUCTS = {
    "reagents-chemicals": [
        (
            "Acetone HPLC Grade",
            "acetone-hplc-grade",
            "REA-ACE-001",
            "High-purity acetone for HPLC and spectroscopy applications. 1L amber glass bottle.",
            Decimal("24.90"),
            250,
            False,
            "/products/acetone-hplc-grade.png",
        ),
        (
            "Ethanol Absolute 99.8%",
            "ethanol-absolute-998",
            "REA-ETH-002",
            "Absolute ethanol, denatured-free, suitable for molecular biology and HPLC. 5L container.",
            Decimal("145.00"),
            80,
            True,
            "/products/ethanol-absolute-998.png",
        ),
        (
            "Hydrochloric Acid 37%",
            "hydrochloric-acid-37",
            "REA-HCL-003",
            "Analytical grade HCl, 37% concentration. 2.5L HDPE bottle with tamper-evident cap.",
            Decimal("89.00"),
            60,
            True,
            "/products/hydrochloric-acid-37.png",
        ),
        (
            "Sodium Hydroxide Pellets",
            "sodium-hydroxide-pellets",
            "REA-NAO-004",
            "ACS grade NaOH pellets, ≥97% purity. 1kg resealable container.",
            Decimal("38.50"),
            120,
            False,
            None,
        ),
        (
            "Phosphate Buffer Saline (PBS)",
            "phosphate-buffer-saline",
            "REA-PBS-005",
            "Ready-to-use 10x PBS concentrate, pH 7.4. Sterile filtered, 500mL.",
            Decimal("42.00"),
            95,
            False,
            None,
        ),
        (
            "Methanol AnalaR",
            "methanol-analar",
            "REA-MET-006",
            "AnalaR grade methanol for analytical chemistry. Low water content, 2.5L.",
            Decimal("67.00"),
            70,
            True,
            None,
        ),
        (
            "Agarose LE",
            "agarose-le",
            "REA-AGA-007",
            "Low electroendosmosis agarose for standard gel electrophoresis. 100g.",
            Decimal("189.00"),
            45,
            False,
            None,
        ),
        (
            "Bromophenol Blue Indicator",
            "bromophenol-blue",
            "REA-BPB-008",
            "pH indicator dye, powder form. pH range 3.0–4.6, yellow to blue. 25g.",
            Decimal("28.00"),
            200,
            False,
            None,
        ),
    ],
    "lab-equipment": [
        (
            "Optical Microscope BX-200",
            "optical-microscope-bx200",
            "EQP-MIC-001",
            "Binocular optical microscope, 40x–1000x magnification. Includes 5 objective lenses and LED illumination.",
            Decimal("3450.00"),
            12,
            False,
            "/products/optical-microscope-bx200.png",
        ),
        (
            "Magnetic Hotplate Stirrer",
            "magnetic-hotplate-stirrer",
            "EQP-HPS-002",
            "Ceramic hotplate with integrated magnetic stirrer. Temperature range RT–340°C, max 1500 RPM.",
            Decimal("890.00"),
            25,
            False,
            None,
        ),
        (
            "Benchtop Centrifuge 6000 RPM",
            "benchtop-centrifuge-6000",
            "EQP-CEN-003",
            "Low-speed centrifuge for standard lab tubes. 6000 RPM max, 12-position rotor, timer function.",
            Decimal("4200.00"),
            8,
            True,
            "/products/benchtop-centrifuge-6000.png",
        ),
        (
            "Vortex Mixer VM-300",
            "vortex-mixer-vm300",
            "EQP-VMX-004",
            "Variable speed vortex mixer, 300–3000 RPM. Touch-activated or continuous mode. Universal head included.",
            Decimal("560.00"),
            30,
            False,
            None,
        ),
        (
            "UV/VIS Spectrophotometer",
            "uv-vis-spectrophotometer",
            "EQP-SPE-005",
            "Single beam UV/VIS spectrophotometer, 190–1100nm range. 1nm bandwidth. RS-232 output.",
            Decimal("8900.00"),
            5,
            True,
            "/products/uv-vis-spectrophotometer.png",
        ),
        (
            "Peristaltic Pump PP-100",
            "peristaltic-pump-pp100",
            "EQP-PMP-006",
            "Variable flow peristaltic pump, 0.1–100 mL/min. Compatible with silicone and Tygon tubing.",
            Decimal("1250.00"),
            15,
            False,
            None,
        ),
    ],
    "glassware": [
        (
            "Borosilicate Beaker 500mL",
            "borosilicate-beaker-500ml",
            "GLS-BEA-001",
            "Borosilicate 3.3 glass beaker with spout. Graduated, heat resistant to 500°C. Pack of 10.",
            Decimal("48.00"),
            300,
            False,
            "/products/borosilicate-beaker-500ml.png",
        ),
        (
            "Erlenmeyer Flask 250mL",
            "erlenmeyer-flask-250ml",
            "GLS-FLA-002",
            "Conical flask with narrow neck, borosilicate glass. Graduated. Pack of 6.",
            Decimal("36.00"),
            250,
            False,
            None,
        ),
        (
            "Graduated Cylinder 100mL",
            "graduated-cylinder-100ml",
            "GLS-CYL-003",
            "Class A borosilicate graduated cylinder. ±0.5mL accuracy. Hexagonal base for stability.",
            Decimal("22.00"),
            400,
            False,
            None,
        ),
        (
            "Microscope Slides Plain",
            "microscope-slides-plain",
            "GLS-SLD-004",
            "Clear borosilicate glass slides, 76x26mm, 1.0mm thickness. Pre-cleaned. Box of 100.",
            Decimal("18.50"),
            500,
            False,
            None,
        ),
        (
            "Petri Dish Glass 90mm",
            "petri-dish-glass-90mm",
            "GLS-PDG-005",
            "Borosilicate glass petri dish with lid, 90mm diameter. Autoclavable. Pack of 10.",
            Decimal("55.00"),
            180,
            False,
            None,
        ),
        (
            "Separating Funnel 250mL",
            "separating-funnel-250ml",
            "GLS-SEP-006",
            "Pear-shaped separating funnel with PTFE stopcock. 250mL volume, borosilicate glass.",
            Decimal("78.00"),
            60,
            False,
            None,
        ),
    ],
    "consumables": [
        (
            "Nitrile Gloves Medium",
            "nitrile-gloves-medium",
            "CON-GLV-001",
            "Powder-free nitrile examination gloves. Chemical resistant. AQL 1.5. Box of 100.",
            Decimal("32.00"),
            800,
            False,
            None,
        ),
        (
            "Micropipette Tips 200µL",
            "micropipette-tips-200ul",
            "CON-TIP-002",
            "Universal fit pipette tips, 200µL volume. DNase/RNase free. Rack of 96, 10 racks per pack.",
            Decimal("28.50"),
            600,
            False,
            "/products/micropipette-tips-200ul.png",
        ),
        (
            "Polypropylene Tubes 15mL",
            "polypropylene-tubes-15ml",
            "CON-TUB-003",
            "Conical centrifuge tubes with screw cap. Graduated, DNase/RNase free. Pack of 500.",
            Decimal("18.50"),
            400,
            False,
            None,
        ),
        (
            "Syringe Filter 0.22µm",
            "syringe-filter-022um",
            "CON-SYF-004",
            "PES membrane syringe filters, 0.22µm pore size, 25mm diameter. Sterile. Pack of 50.",
            Decimal("95.00"),
            200,
            False,
            None,
        ),
        (
            "Plastic Petri Dish 90mm",
            "plastic-petri-dish-90mm",
            "CON-PDP-005",
            "Sterile polystyrene petri dishes with lid, 90mm. Vented. Pack of 90.",
            Decimal("24.00"),
            350,
            False,
            None,
        ),
        (
            "Parafilm M Sealing Film",
            "parafilm-m-sealing-film",
            "CON-PFM-006",
            "Thermoplastic stretch film for sealing laboratory containers. 10cm x 38m roll.",
            Decimal("62.00"),
            150,
            False,
            None,
        ),
    ],
    "measuring-testing": [
        (
            "Analytical Balance 0.0001g",
            "analytical-balance-0001g",
            "MEA-BAL-001",
            "Internal calibration analytical balance, 220g capacity, 0.1mg readability. RS-232 output.",
            Decimal("4800.00"),
            10,
            True,
            "/products/analytical-balance-0001g.png",
        ),
        (
            "Digital pH Meter HI-98103",
            "digital-ph-meter-hi98103",
            "MEA-PHM-002",
            "Portable pH meter with ATC probe. Range 0–14 pH, ±0.02 accuracy. Auto-calibration.",
            Decimal("289.00"),
            40,
            False,
            None,
        ),
        (
            "Infrared Thermometer",
            "infrared-thermometer",
            "MEA-IRT-003",
            "Non-contact IR thermometer, -50°C to +550°C range. 12:1 distance-to-spot ratio.",
            Decimal("149.00"),
            75,
            False,
            None,
        ),
        (
            "Conductivity Meter CM-500",
            "conductivity-meter-cm500",
            "MEA-CON-004",
            "Bench conductivity meter, 0.01µS/cm to 200mS/cm range. Temperature compensation.",
            Decimal("680.00"),
            20,
            False,
            None,
        ),
        (
            "Refractometer 0-32% Brix",
            "refractometer-0-32-brix",
            "MEA-REF-005",
            "Handheld optical refractometer, 0–32% Brix scale. ATC. Includes case and pipette.",
            Decimal("95.00"),
            55,
            False,
            None,
        ),
        (
            "Stopwatch Digital Lab",
            "stopwatch-digital-lab",
            "MEA-STW-006",
            "Precision digital stopwatch, 1/100 second resolution. Water resistant, countdown timer.",
            Decimal("42.00"),
            120,
            False,
            None,
        ),
    ],
    "safety-equipment": [
        (
            "Safety Goggles Chemical Splash",
            "safety-goggles-chemical-splash",
            "SAF-GOG-001",
            "Indirect ventilation chemical splash goggles. Anti-fog polycarbonate lens. EN 166 certified.",
            Decimal("28.00"),
            300,
            False,
            None,
        ),
        (
            "Lab Coat Cotton 260g",
            "lab-coat-cotton-260g",
            "SAF-COT-002",
            "100% cotton lab coat, 260g/m². Autoclavable. Sizes S–XXL. Knit cuffs, 3 pockets.",
            Decimal("89.00"),
            150,
            False,
            None,
        ),
        (
            "Chemical Spill Kit 20L",
            "chemical-spill-kit-20l",
            "SAF-SPL-003",
            "Universal spill kit for acids, bases, and solvents. 20L capacity. Includes PPE and disposal bags.",
            Decimal("245.00"),
            35,
            True,
            "/products/chemical-spill-kit-20l.png",
        ),
        (
            "Eyewash Station Portable",
            "eyewash-station-portable",
            "SAF-EWS-004",
            "Portable gravity-fed eyewash station. 9L capacity. ANSI Z358.1 compliant. Wall-mount bracket included.",
            Decimal("189.00"),
            20,
            True,
            "/products/eyewash-station-portable.png",
        ),
        (
            "Chemical Resistant Apron",
            "chemical-resistant-apron",
            "SAF-APR-005",
            "PVC chemical resistant apron, 90x120cm. Adjustable neck and waist straps. EN 13034 certified.",
            Decimal("45.00"),
            200,
            False,
            None,
        ),
        (
            "First Aid Kit Laboratory",
            "first-aid-kit-laboratory",
            "SAF-FAK-006",
            "Laboratory-specific first aid kit. 73 items including burn gel, eye wash, and chemical exposure guide.",
            Decimal("135.00"),
            60,
            False,
            None,
        ),
    ],
    "lab-furniture": [
        (
            "Lab Bench Epoxy Top 1500mm",
            "lab-bench-epoxy-top-1500mm",
            "FUR-BEN-001",
            "Steel frame lab bench with chemical-resistant epoxy resin top. 1500x750x900mm. Adjustable feet.",
            Decimal("2800.00"),
            8,
            True,
            None,
        ),
        (
            "Reagent Storage Rack 5-Tier",
            "reagent-storage-rack-5tier",
            "FUR-RAC-002",
            "Polypropylene chemical storage rack, 5 tiers. Holds standard 1L bottles. 600x200x400mm.",
            Decimal("320.00"),
            30,
            False,
            None,
        ),
        (
            "Lab Stool Adjustable",
            "lab-stool-adjustable",
            "FUR-STL-003",
            "Ergonomic lab stool, 450–650mm seat height. Chemical-resistant PU upholstery. 5-star base.",
            Decimal("490.00"),
            25,
            False,
            None,
        ),
        (
            "Fume Hood Storage Cabinet",
            "fume-hood-storage-cabinet",
            "FUR-FHC-004",
            "Under-fume-hood storage cabinet, 900x500x600mm. Steel construction with acid-resistant coating.",
            Decimal("1650.00"),
            10,
            True,
            "/products/fume-hood-storage-cabinet.png",
        ),
        (
            "Wall-Mount Drying Rack",
            "wall-mount-drying-rack",
            "FUR-DRY-005",
            "Stainless steel wall-mounted glassware drying rack. 30 pegs, adjustable spacing. 600x400mm.",
            Decimal("185.00"),
            40,
            False,
            None,
        ),
    ],
}


# ── SEED FUNCTION ─────────────────────────────────────────────────────────────


async def seed():
    async with AsyncSessionLocal() as db:
        print("🧪 Starting Proxima Lab Supply seed...")

        print("🧹 Clearing existing data...")
        await db.execute(delete(OrderItem))
        await db.execute(delete(Order))
        await db.execute(delete(CartItem))
        await db.execute(delete(ProductVolumeDiscount))
        await db.execute(delete(Product))
        await db.execute(delete(Category))
        await db.execute(delete(CompanyRequest))
        await db.execute(delete(Address))
        await db.execute(delete(User))
        await db.execute(delete(Company))
        await db.commit()

        # COMPANIES
        print("🏢 Creating companies...")
        acme_company_id = uuid.uuid4()
        acme_company = Company(
            id=acme_company_id,
            name="Acme Laboratory Labs",
            nip="1234567890",
            discount_percentage=Decimal("20.00"),
            email_domain="acmelabs.com",
            is_active=True,
        )
        db.add(acme_company)
        await db.flush()
        print(f"   ✓ {acme_company.name}")

        # USERS
        print("👥 Creating users (Password for all: 'Password123')...")
        password_hash = PasswordHash.recommended()
        test_password_hash = password_hash.hash("Password123")

        users_to_create = [
            # Global Admin
            User(
                email="admin@proxima.com",
                password_hash=test_password_hash,
                first_name="Super",
                last_name="Admin",
                role=UserRole.ADMIN,
                is_verified=True,
                is_active=True,
                company_id=None,
            ),
            # B2C Buyer
            User(
                email="kowalski@gmail.com",
                password_hash=test_password_hash,
                first_name="Jan",
                last_name="Kowalski",
                role=UserRole.CUSTOMER,
                is_verified=True,
                is_active=True,
                company_id=None,
            ),
            # B2B Admin
            User(
                email="manager@acmelabs.com",
                password_hash=test_password_hash,
                first_name="Anna",
                last_name="Nowak",
                role=UserRole.COMPANY_ADMIN,
                is_verified=True,
                is_active=True,
                company_id=acme_company_id,
                company_joined_at=datetime(2024, 1, 15, tzinfo=timezone.utc),
            ),
            # B2B Buyer
            User(
                email="buyer@acmelabs.com",
                password_hash=test_password_hash,
                first_name="Piotr",
                last_name="Wiśniewski",
                role=UserRole.CUSTOMER,
                is_verified=True,
                is_active=True,
                company_id=acme_company_id,
                company_joined_at=datetime(2024, 3, 10, tzinfo=timezone.utc),
            ),
        ]

        db.add_all(users_to_create)
        await db.flush()
        print(f"   ✓ Created {len(users_to_create)} test users")

        # COMPANY BILLING ADDRESS
        print("📍 Creating Acme billing address...")
        acme_billing = Address(
            company_id=acme_company_id,
            address_type=AddressType.BILLING,
            label="Siedziba główna",
            street="ul. Naukowa 12",
            city="Warszawa",
            postal_code="00-001",
            country="Poland",
        )
        db.add(acme_billing)
        await db.flush()
        print(f"   ✓ {acme_billing.street}, {acme_billing.city}")

        # CATEGORIES
        print("📂 Creating categories...")
        category_map: dict[str, uuid.UUID] = {}

        for cat_data in CATEGORIES:
            cat = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data["description"],
            )
            db.add(cat)
            await db.flush()
            category_map[cat_data["slug"]] = cat.id
            print(f"   ✓ {cat_data['name']}")

        # PRODUCTS
        print("📦 Creating products...")
        total_products = 0
        created_products_for_discounts = []

        for category_slug, products in PRODUCTS.items():
            category_id = category_map[category_slug]
            for name, slug, sku, description, price, stock, is_b2b, img_url in products:
                product = Product(
                    category_id=category_id,
                    name=name,
                    slug=slug,
                    sku=sku,
                    description=description,
                    base_price=price,
                    stock_quantity=stock,
                    is_active=True,
                    is_b2b_only=is_b2b,
                    main_image_url=img_url,
                )
                db.add(product)
                await db.flush()

                if (
                    category_slug == "reagents-chemicals"
                    or category_slug == "consumables"
                ):
                    created_products_for_discounts.append(product)

                total_products += 1
            print(f"   ✓ {category_slug} — {len(products)} products")

        # PRODUCT VOLUME DISCOUNTS

        print("💰 Creating volume discounts...")
        discounts_to_create = []

        for prod in created_products_for_discounts[:3]:
            discounts_to_create.append(
                ProductVolumeDiscount(
                    product_id=prod.id,
                    min_quantity=10,
                    discount_percentage=Decimal("5.00"),
                )
            )
            discounts_to_create.append(
                ProductVolumeDiscount(
                    product_id=prod.id,
                    min_quantity=50,
                    discount_percentage=Decimal("15.00"),
                )
            )

        db.add_all(discounts_to_create)
        print(f"   ✓ Created {len(discounts_to_create)} discount tiers")

        await db.commit()
        print("\n✅ Seed complete!")
        print(f"   {len(CATEGORIES)} categories")
        print(f"   {total_products} products")
        print("   Test accounts ready to use with password: password123")


if __name__ == "__main__":
    asyncio.run(seed())
