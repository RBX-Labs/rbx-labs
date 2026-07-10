# NG Icon/Logo Asset Audit (2026-05-17)

## Blocking issues for UI use

- `ng_privacy.png` (`flutter_app/assets/ng_icons`) is **not transparent** (`hasAlpha: no`).
- `ng_privacy_light.png` (`flutter_app/assets/ng_icons`) is **not transparent** (`hasAlpha: no`).
- `ng_logo_w_text.png` and `ng_logo_w_text_light.png` have very small visible content relative to canvas and render tiny when used directly.

## Replace first (highest impact)

- `rbx-labs/assets/branding/logos/ng_logo_w_text.png`
- `rbx-labs/assets/branding/logos/ng_logo_w_text_light.png`
- `flutter_app/assets/logo/ng_logo_w_text.png`
- `flutter_app/assets/logo/ng_logo_w_text_light.png`
- `flutter_app/assets/ng_icons/ng_privacy.png`
- `flutter_app/assets/ng_icons/ng_privacy_light.png`

## Icons with heavy transparent padding (need cropped exports)

These are transparent, but icon occupancy is low, so they appear undersized unless scaled in code.

- `ng_alert.png`
- `ng_alert_light.png`
- `ng_decisions.png`
- `ng_insights.png`
- `ng_insights_light.png`
- `ng_live_monitoring.png`
- `ng_live_monitoring_light.png`
- `ng_network_activity.png`
- `ng_scanning.png`
- `ng_seamless.png`
- `ng_seamless_light.png`
- `ng_trust.png`
- `ng_trust_light.png`
- `ng_wifi_trust.png`
- `ng_wifi_trust_light.png`

## Most problematic tiny-content icons (occupancy very low)

- `ng_alert_light.png`
- `ng_decisions.png`
- `ng_insights_light.png`
- `ng_seamless.png`
- `ng_seamless_light.png`
- `ng_trust_light.png`

## Logos with heavy padding

- `ng_logo.png`
- `ng_logo_light.png`
- `ng_logo_w_text.png`
- `ng_logo_w_text_light.png`
- `rbx-logo.png`

## Export guidance for replacements

- Keep transparent background (`RGBA`, not flattened RGB).
- Crop to tight visual bounds plus consistent margin (around 6–10%).
- Keep dark/light variants aligned to same visual box.
- Use square canvas for icons and only use wide canvas for lockups that are meant to be wide.
