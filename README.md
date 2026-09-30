# Vireo support intelligence

A production-minded support analytics demo for the provided Vireo exports. It joins tickets to customers, orders, products, and agents; derives a source-grounded taxonomy; sends small batches of ticket text to Gemini for categorization; exposes validation and workload analysis; and exports the currently visible real rows as CSV.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

The app works without environment variables using the checked-in `data/` snapshot. Add `GOOGLE_GENERATIVE_AI_API_KEY` to enable Gemini categorization. Add `DATABASE_URL` to enable Neon persistence; run `schema.sql` first. The offline dataset remains the fallback if Neon is unavailable.

## Data and decisions

The source files are joined by `customer_id`, `order_id`, `product_sku`, and `agent_id`. The existing ticket category is retained as a source tag, not treated as AI ground truth. The fallback classifier uses both customer messages and agent notes so the app remains usable without an API key. The application uses Google Gemini 3.5 Flash Lite (model identifier: `gemini-3.5-flash-lite`) via the `@ai-sdk/google` package/provider. Gemini requests are capped at 10 tickets and use a low-output JSON contract; every AI response includes model, batch size, and rationale in the categorization workflow.

Refund value is the sum of `refund_amount_inr` in `tickets.csv`, not an estimate. Exports are generated from the active page's loaded rows, never demo rows. Date coverage follows the source timestamps.

## Production notes

- Use a server-side Gemini key only; never expose it in client code.
- Review low-confidence labels before operational decisions.
- Run `npm run build` before deployment.

