# Feature-specific extensions (optional)

The Feature → Task **engine** and agent hooks are generic.

Put **feature-specific** helpers here later, for example:

- which Feature issue a product area maps to
- custom commit-message templates
- extra checks before marking a Task done

Runtime “where is the agent right now?” belongs in `../state.json` (gitignored), not in the shared hooks.

The engine loads only `../config.json` today. Extension loading can be added without changing Cursor hook entrypoints.
