---
name: Admin analytics aggregation
description: The current provider interaction metrics are cumulative counters, while only requests, messages, and payments have event timestamps for daily trends.
---

Provider profile views, call clicks, and WhatsApp clicks are stored as cumulative counters rather than dated events. Any date-range dashboard must label those values as cumulative totals unless a separate interaction-event history is added.

**Why:** Filtering cumulative counters by date would present inaccurate operational data.

**How to apply:** Keep trend charts based on timestamped requests, messages, and payments; treat provider interaction counters as all-time until event history exists.