/* Keep old rule modules available for regression tests, but publish only the
 * audited source directory. Legacy scores and inferred amounts are not awards. */
SCHEMES.splice(0, SCHEMES.length, ...SchemeCatalog.records.map(s => ({ ...s })));
