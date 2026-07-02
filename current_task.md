## Section 4 (część 2) — poprawki #2 (edycja BILLING, blokada B2C dla b2b, podział historii)

### 1. Adres BILLING firmy — edycja zamiast usuwania
Firma musi zawsze mieć adres rozliczeniowy (niezmiennik z poprawki #1), więc adresu `BILLING` **nie
wolno usuwać — tylko edytować** (uniknięcie zamówień bez adresu rozliczeniowego). SHIPPING bez zmian
(add/delete).
- Backend: dodać **`PUT /companies/addresses/{id}`** (`require_company_admin`); w
  `DELETE /companies/addresses/{id}` **zablokować** usunięcie adresu `BILLING`
  (`CannotDeleteBillingAddressException` 400). BILLING powstaje przy tworzeniu firmy, potem edytowany.
- Frontend: `pages/company/CompanyAddressesTab.tsx` — sekcja „Billing address" tylko z **Edit**
  (`AddressForm`); lista SHIPPING bez zmian.

### 2. Brak opcji B2C, gdy w koszyku jest produkt `is_b2b_only`
Zamiast pozwolić wybrać rozliczenie B2C i dopiero na końcu blokować (zmuszając do powtórki), już na
kroku „Dokument" **nie oferujemy B2C**, gdy w zaznaczonych pozycjach jest `is_b2b_only`.
- Checkout liczy `hasB2bSelected` (z `useCartView`):
  - **jest `company_id`** → wymuszony tryb **COMPANY** (tylko `COMPANY_INVOICE`; paragon/faktura-B2C
    ukryte) + info „koszyk zawiera produkty firmowe — zakup na firmę".
  - **brak `company_id`** → **blokada przed krokiem dokumentu**: „te produkty wymagają konta
    firmowego — usuń je z koszyka lub dołącz do firmy" (link do afiliacji); nie można przejść dalej.
- Warstwa UX; backendowy `B2BRestricted` w `create_order` zostaje jako defense-in-depth. `purchaseMode`
  PRIVATE jest ignorowany, gdy koszyk ma b2b (kontekst wynika z zawartości koszyka).

### 3. Historia zamówień — podział firmowe / prywatne
W `pages/profile/OrdersTab.tsx` dodać wewnętrzny przełącznik (segmented control) **Private / Company**.
- Podział po `purchase_type` (B2B = firmowe, B2C = prywatne). Backend: `GET /orders` dostaje param
  `?purchase_type=B2B|B2C`; `hooks/order/useOrders.ts` + `api/order.ts` przyjmują filtr (klucz React
  Query zawiera filtr).
- Segment **Company** pokazywany tylko gdy user ma `company_id` (czysty B2C nie widzi pustej
  zakładki); każdy segment → lista + wejście w `OrderDetailPage`.

### Testy
- `PUT` adresu firmy — tylko `company_admin`; `DELETE` na `BILLING` → 400. `GET /orders?purchase_type=`
  filtruje poprawnie i tylko własne zamówienia.

### Weryfikacja
- E2e: BILLING firmy tylko do edycji; koszyk z b2b bez firmy → blokada przed dokumentem; z firmą →
  wymuszony `COMPANY_INVOICE`; historia z przełącznikiem Private/Company.

