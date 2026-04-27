<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into this React + Vite application (OCD Freedom). The following changes were made:

- **`src/App.jsx`**: Fixed `api_host` to read from `VITE_POSTHOG_HOST` environment variable (was hardcoded to `https://app.posthog.com`). Added `enableExceptionAutocapture: true` to the PostHog init call. Added six new `posthog.capture()` calls across the app's key user flows.
- **`.env`**: Created with `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` environment variables.

## Events

| Event name | Description | File |
|---|---|---|
| `disclaimer_accepted` | User accepts the app disclaimer for the first time — marks start of onboarding | `src/App.jsx` |
| `tab_viewed` | User navigates to a top-level tab (sos, test, path). Property: `tab_name` | `src/App.jsx` |
| `paywall_viewed` | User sees the paywall/upgrade screen. Key conversion-funnel event | `src/App.jsx` |
| `exercise_started` | User starts an ERP exercise. Property: `exercise_id` (breathing, observe, challenge, grounding) | `src/App.jsx` |
| `exercise_completed` | User completes an ERP exercise. Property: `exercise_id` | `src/App.jsx` |
| `sos_urgency_post_rated` | User rates their post-session urgency level. Property: `urgency_level` (1–10) | `src/App.jsx` |
| `sos_started` *(pre-existing)* | SOS crisis session started | `src/App.jsx` |
| `sos_completed` *(pre-existing)* | SOS crisis session completed | `src/App.jsx` |
| `test_started` *(pre-existing)* | Y-BOCS OCD test started | `src/App.jsx` |
| `test_completed` *(pre-existing)* | Y-BOCS OCD test completed. Properties: `score`, `severity_level` | `src/App.jsx` |
| `achievement_unlocked` *(pre-existing)* | User unlocks a badge. Property: `achievement_name` | `src/App.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/399763/dashboard/1515544
- **SOS Session Funnel** (sos_started → sos_completed): https://us.posthog.com/project/399763/insights/GovhQiCy
- **Test Completion Funnel** (test_started → test_completed): https://us.posthog.com/project/399763/insights/Qv2tW4df
- **Paywall Views Over Time**: https://us.posthog.com/project/399763/insights/HHe9qBMF
- **Exercise Start vs Completion**: https://us.posthog.com/project/399763/insights/1EwZjfiP
- **New User Onboarding (Disclaimer Accepted)**: https://us.posthog.com/project/399763/insights/UXVAsvuO

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
