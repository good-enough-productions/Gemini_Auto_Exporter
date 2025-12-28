# Lessons Learned — Gemini_Auto_Exporter

This is a living knowledge base describing decisions, alternatives considered, and why certain choices were made.

## Making the repo private
- Changing repository visibility requires GitHub account permissions and cannot be done from local git alone.
- You can make the repo private via the GitHub website: open the repository Settings → General → "Change repository visibility" → choose **Make private**.
- Or use the GitHub CLI (if installed and authenticated):

```bash
gh repo edit good-enough-productions/Gemini_Auto_Exporter --visibility private
```

Note: the automation that created the repo used the agent's credentials; if you don't have the necessary permissions on that organization/account, make the change from your GitHub account.

## Why add GitHub Actions (CI)?
- Purpose: validate repository files on push/PR (basic safety checks) so malformed JSON or obvious breakages are caught early.
- The provided workflow is intentionally minimal: it validates `manifest.json` and `package.json` (if present). It also leaves a placeholder for JS lint/test steps once a `package.json` and toolchain are added.

## Alternatives considered
- Run no CI: faster, but removes an automated safety net for pushes and PRs.
- Add full Node.js linting and tests: good for mature projects, but this repo currently lacks `package.json` and test scripts. When adding Node tooling, update `.github/workflows/ci.yml` to run `npm ci` and `npm test` or `eslint`.

## Next steps and recommendations
- If you want the repo private and you own the GitHub account, run the `gh` command above or use the web UI.
- Add a small `package.json` and an `npm run lint` script to enable proper JS linting in CI.
- Consider adding a release or tagging workflow if you plan to publish the extension packaged `.zip` or a Chrome Web Store artifact.

## Notes for future me
- Keep this file concise and date-ed when adding new lessons.
