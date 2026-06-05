-- Verify all performance indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'invoices',
    'contracts',
    'income_log',
    'payments',
    'clients',
    'profiles'
  )
ORDER BY tablename, indexname;
