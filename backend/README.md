# Backend resources

Database schemas and migrations for Supabase live here. Apply SQL through the Supabase project after reviewing it. Browser code must use only the public publishable key and database Row Level Security; privileged operations belong in trusted server-side functions.

## Affiliate product and service catalog

Apply `supabase/affiliate-catalog.sql` in the Supabase SQL Editor after the base schema and existing affiliate/payout migrations. It creates:

- `affiliate_catalog_items`: admin-managed product/service catalog, commission model, destination URL, image URL, and publication status.
- `affiliate_item_links`: each affiliate's own tracking URL, with admin review status.

The dashboard Admin section provides create/edit/archive controls and approves/rejects affiliate URLs. The Affiliate section lists active catalog items and submits a personal tracking URL. Row Level Security limits catalog management and review to admins; affiliates can read active items and submit links only for their own active affiliate account. No service-role key is used in browser code.
