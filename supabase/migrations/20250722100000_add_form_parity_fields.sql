/*
# [Operation] Add Form Parity Fields
Adds new optional fields to the patients and orders tables to support a unified form experience.

## Query Description:
This operation adds several new columns to the `patients` and `orders` tables.
- `patients.pcp_phone`: Stores the phone number for the Primary Care Provider.
- `patients.preferred_contact_method`: Stores the patient's preferred method of contact (e.g., Phone, Email).
- `patients.insurance_verified`: A boolean flag to track if insurance has been verified.
- `orders.authorization_number`: Stores the pre-authorization number for an order.
- `orders.order_date`: Stores the date an order was placed.
These changes are non-destructive and add new capabilities without affecting existing data.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the columns)

## Structure Details:
- Affects tables: `patients`, `orders`
- Adds columns: `pcp_phone`, `preferred_contact_method`, `insurance_verified`, `authorization_number`, `order_date`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: None added
- Triggers: None added
- Estimated Impact: Negligible performance impact on existing queries.
*/

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS pcp_phone TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS authorization_number TEXT,
ADD COLUMN IF NOT EXISTS order_date DATE;
