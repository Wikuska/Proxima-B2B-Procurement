"""
Proxima Lab Supply — Database Seed Script
Run from backend/ directory: python -m app.seeds.seed_catalog
"""

import asyncio
import uuid
from decimal import Decimal

from app.database import AsyncSessionLocal
from app.models import Category, Product
from sqlalchemy import select

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
# Format: (name, slug, sku, description, base_price, stock_quantity, b2b_available, b2c_available)

PRODUCTS = {
    "reagents-chemicals": [
        (
            "Acetone HPLC Grade",
            "acetone-hplc-grade",
            "REA-ACE-001",
            "High-purity acetone for HPLC and spectroscopy applications. 1L amber glass bottle.",
            Decimal("24.90"),
            250,
            True,
            True,
        ),
        (
            "Ethanol Absolute 99.8%",
            "ethanol-absolute-998",
            "REA-ETH-002",
            "Absolute ethanol, denatured-free, suitable for molecular biology and HPLC. 5L container.",
            Decimal("145.00"),
            80,
            True,
            False,
        ),
        (
            "Hydrochloric Acid 37%",
            "hydrochloric-acid-37",
            "REA-HCL-003",
            "Analytical grade HCl, 37% concentration. 2.5L HDPE bottle with tamper-evident cap.",
            Decimal("89.00"),
            60,
            True,
            False,
        ),
        (
            "Sodium Hydroxide Pellets",
            "sodium-hydroxide-pellets",
            "REA-NAO-004",
            "ACS grade NaOH pellets, ≥97% purity. 1kg resealable container.",
            Decimal("38.50"),
            120,
            True,
            True,
        ),
        (
            "Phosphate Buffer Saline (PBS)",
            "phosphate-buffer-saline",
            "REA-PBS-005",
            "Ready-to-use 10x PBS concentrate, pH 7.4. Sterile filtered, 500mL.",
            Decimal("42.00"),
            95,
            True,
            True,
        ),
        (
            "Methanol AnalaR",
            "methanol-analar",
            "REA-MET-006",
            "AnalaR grade methanol for analytical chemistry. Low water content, 2.5L.",
            Decimal("67.00"),
            70,
            True,
            False,
        ),
        (
            "Agarose LE",
            "agarose-le",
            "REA-AGA-007",
            "Low electroendosmosis agarose for standard gel electrophoresis. 100g.",
            Decimal("189.00"),
            45,
            True,
            True,
        ),
        (
            "Bromophenol Blue Indicator",
            "bromophenol-blue",
            "REA-BPB-008",
            "pH indicator dye, powder form. pH range 3.0–4.6, yellow to blue. 25g.",
            Decimal("28.00"),
            200,
            True,
            True,
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
            True,
            True,
        ),
        (
            "Magnetic Hotplate Stirrer",
            "magnetic-hotplate-stirrer",
            "EQP-HPS-002",
            "Ceramic hotplate with integrated magnetic stirrer. Temperature range RT–340°C, max 1500 RPM.",
            Decimal("890.00"),
            25,
            True,
            True,
        ),
        (
            "Benchtop Centrifuge 6000 RPM",
            "benchtop-centrifuge-6000",
            "EQP-CEN-003",
            "Low-speed centrifuge for standard lab tubes. 6000 RPM max, 12-position rotor, timer function.",
            Decimal("4200.00"),
            8,
            True,
            False,
        ),
        (
            "Vortex Mixer VM-300",
            "vortex-mixer-vm300",
            "EQP-VMX-004",
            "Variable speed vortex mixer, 300–3000 RPM. Touch-activated or continuous mode. Universal head included.",
            Decimal("560.00"),
            30,
            True,
            True,
        ),
        (
            "UV/VIS Spectrophotometer",
            "uv-vis-spectrophotometer",
            "EQP-SPE-005",
            "Single beam UV/VIS spectrophotometer, 190–1100nm range. 1nm bandwidth. RS-232 output.",
            Decimal("8900.00"),
            5,
            True,
            False,
        ),
        (
            "Peristaltic Pump PP-100",
            "peristaltic-pump-pp100",
            "EQP-PMP-006",
            "Variable flow peristaltic pump, 0.1–100 mL/min. Compatible with silicone and Tygon tubing.",
            Decimal("1250.00"),
            15,
            True,
            True,
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
            True,
            True,
        ),
        (
            "Erlenmeyer Flask 250mL",
            "erlenmeyer-flask-250ml",
            "GLS-FLA-002",
            "Conical flask with narrow neck, borosilicate glass. Graduated. Pack of 6.",
            Decimal("36.00"),
            250,
            True,
            True,
        ),
        (
            "Graduated Cylinder 100mL",
            "graduated-cylinder-100ml",
            "GLS-CYL-003",
            "Class A borosilicate graduated cylinder. ±0.5mL accuracy. Hexagonal base for stability.",
            Decimal("22.00"),
            400,
            True,
            True,
        ),
        (
            "Microscope Slides Plain",
            "microscope-slides-plain",
            "GLS-SLD-004",
            "Clear borosilicate glass slides, 76x26mm, 1.0mm thickness. Pre-cleaned. Box of 100.",
            Decimal("18.50"),
            500,
            True,
            True,
        ),
        (
            "Petri Dish Glass 90mm",
            "petri-dish-glass-90mm",
            "GLS-PDG-005",
            "Borosilicate glass petri dish with lid, 90mm diameter. Autoclavable. Pack of 10.",
            Decimal("55.00"),
            180,
            True,
            True,
        ),
        (
            "Separating Funnel 250mL",
            "separating-funnel-250ml",
            "GLS-SEP-006",
            "Pear-shaped separating funnel with PTFE stopcock. 250mL volume, borosilicate glass.",
            Decimal("78.00"),
            60,
            True,
            True,
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
            True,
            True,
        ),
        (
            "Micropipette Tips 200µL",
            "micropipette-tips-200ul",
            "CON-TIP-002",
            "Universal fit pipette tips, 200µL volume. DNase/RNase free. Rack of 96, 10 racks per pack.",
            Decimal("28.50"),
            600,
            True,
            True,
        ),
        (
            "Polypropylene Tubes 15mL",
            "polypropylene-tubes-15ml",
            "CON-TUB-003",
            "Conical centrifuge tubes with screw cap. Graduated, DNase/RNase free. Pack of 500.",
            Decimal("18.50"),
            400,
            True,
            True,
        ),
        (
            "Syringe Filter 0.22µm",
            "syringe-filter-022um",
            "CON-SYF-004",
            "PES membrane syringe filters, 0.22µm pore size, 25mm diameter. Sterile. Pack of 50.",
            Decimal("95.00"),
            200,
            True,
            True,
        ),
        (
            "Plastic Petri Dish 90mm",
            "plastic-petri-dish-90mm",
            "CON-PDP-005",
            "Sterile polystyrene petri dishes with lid, 90mm. Vented. Pack of 90.",
            Decimal("24.00"),
            350,
            True,
            True,
        ),
        (
            "Parafilm M Sealing Film",
            "parafilm-m-sealing-film",
            "CON-PFM-006",
            "Thermoplastic stretch film for sealing laboratory containers. 10cm x 38m roll.",
            Decimal("62.00"),
            150,
            True,
            True,
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
            False,
        ),
        (
            "Digital pH Meter HI-98103",
            "digital-ph-meter-hi98103",
            "MEA-PHM-002",
            "Portable pH meter with ATC probe. Range 0–14 pH, ±0.02 accuracy. Auto-calibration.",
            Decimal("289.00"),
            40,
            True,
            True,
        ),
        (
            "Infrared Thermometer",
            "infrared-thermometer",
            "MEA-IRT-003",
            "Non-contact IR thermometer, -50°C to +550°C range. 12:1 distance-to-spot ratio.",
            Decimal("149.00"),
            75,
            True,
            True,
        ),
        (
            "Conductivity Meter CM-500",
            "conductivity-meter-cm500",
            "MEA-CON-004",
            "Bench conductivity meter, 0.01µS/cm to 200mS/cm range. Temperature compensation.",
            Decimal("680.00"),
            20,
            True,
            True,
        ),
        (
            "Refractometer 0-32% Brix",
            "refractometer-0-32-brix",
            "MEA-REF-005",
            "Handheld optical refractometer, 0–32% Brix scale. ATC. Includes case and pipette.",
            Decimal("95.00"),
            55,
            True,
            True,
        ),
        (
            "Stopwatch Digital Lab",
            "stopwatch-digital-lab",
            "MEA-STW-006",
            "Precision digital stopwatch, 1/100 second resolution. Water resistant, countdown timer.",
            Decimal("42.00"),
            120,
            True,
            True,
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
            True,
            True,
        ),
        (
            "Lab Coat Cotton 260g",
            "lab-coat-cotton-260g",
            "SAF-COT-002",
            "100% cotton lab coat, 260g/m². Autoclavable. Sizes S–XXL. Knit cuffs, 3 pockets.",
            Decimal("89.00"),
            150,
            True,
            True,
        ),
        (
            "Chemical Spill Kit 20L",
            "chemical-spill-kit-20l",
            "SAF-SPL-003",
            "Universal spill kit for acids, bases, and solvents. 20L capacity. Includes PPE and disposal bags.",
            Decimal("245.00"),
            35,
            True,
            False,
        ),
        (
            "Eyewash Station Portable",
            "eyewash-station-portable",
            "SAF-EWS-004",
            "Portable gravity-fed eyewash station. 9L capacity. ANSI Z358.1 compliant. Wall-mount bracket included.",
            Decimal("189.00"),
            20,
            True,
            False,
        ),
        (
            "Chemical Resistant Apron",
            "chemical-resistant-apron",
            "SAF-APR-005",
            "PVC chemical resistant apron, 90x120cm. Adjustable neck and waist straps. EN 13034 certified.",
            Decimal("45.00"),
            200,
            True,
            True,
        ),
        (
            "First Aid Kit Laboratory",
            "first-aid-kit-laboratory",
            "SAF-FAK-006",
            "Laboratory-specific first aid kit. 73 items including burn gel, eye wash, and chemical exposure guide.",
            Decimal("135.00"),
            60,
            True,
            True,
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
            False,
        ),
        (
            "Reagent Storage Rack 5-Tier",
            "reagent-storage-rack-5tier",
            "FUR-RAC-002",
            "Polypropylene chemical storage rack, 5 tiers. Holds standard 1L bottles. 600x200x400mm.",
            Decimal("320.00"),
            30,
            True,
            True,
        ),
        (
            "Lab Stool Adjustable",
            "lab-stool-adjustable",
            "FUR-STL-003",
            "Ergonomic lab stool, 450–650mm seat height. Chemical-resistant PU upholstery. 5-star base.",
            Decimal("490.00"),
            25,
            True,
            True,
        ),
        (
            "Fume Hood Storage Cabinet",
            "fume-hood-storage-cabinet",
            "FUR-FHC-004",
            "Under-fume-hood storage cabinet, 900x500x600mm. Steel construction with acid-resistant coating.",
            Decimal("1650.00"),
            10,
            True,
            False,
        ),
        (
            "Wall-Mount Drying Rack",
            "wall-mount-drying-rack",
            "FUR-DRY-005",
            "Stainless steel wall-mounted glassware drying rack. 30 pegs, adjustable spacing. 600x400mm.",
            Decimal("185.00"),
            40,
            True,
            True,
        ),
    ],
}


# ── SEED FUNCTION ─────────────────────────────────────────────────────────────


async def seed():
    async with AsyncSessionLocal() as db:
        print("🧪 Starting Proxima Lab Supply seed...")

        existing = await db.scalar(select(Category).limit(1))
        if existing:
            print("⚠️  Database already seeded. Skipping.")
            return

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

        print("📦 Creating products...")
        total_products = 0

        for category_slug, products in PRODUCTS.items():
            category_id = category_map[category_slug]
            for name, slug, sku, description, price, stock, b2b, b2c in products:
                product = Product(
                    category_id=category_id,
                    name=name,
                    slug=slug,
                    sku=sku,
                    description=description,
                    base_price=price,
                    stock_quantity=stock,
                    is_active=True,
                    b2b_available=b2b,
                    b2c_available=b2c,
                )
                db.add(product)
                total_products += 1
            print(f"   ✓ {category_slug} — {len(products)} products")

        await db.commit()
        print("\n✅ Seed complete!")
        print(f"   {len(CATEGORIES)} categories")
        print(f"   {total_products} products")


if __name__ == "__main__":
    asyncio.run(seed())
