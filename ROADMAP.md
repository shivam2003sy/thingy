# Thingy App — Roadmap

**Focus:** IPL & India matches only.

---

## ✅ Done

- **CricAPI integration** — all 6 endpoints wired (`/currentMatches`, `/matches`, `/series`, `/series_info`, `/players`, `/players_info`)
- **IPL + India filter** — backend filters out all non-IPL / non-India matches globally
- **Live match feed** — HomeScreen shows real scores via `cricketStore`, pull-to-refresh
- **Fixtures tab** — upcoming IPL/India matches on HomeScreen
- **Series browser** — SeriesScreen + SeriesDetailScreen with match list
- **Player search** — debounced search → player detail with career stats by format
- **Ball Rush** — community per-ball prediction with 15s windows, crowd %, token settlement
- **1v1 Battle** — 6-ball matchmaking, 12s predict timer, scoring, results
- **Contests** — entry-fee contests with prize pools
- **Token economy** — spend/award via Supabase RPC, leaderboard
- **Push notifications** — Firebase Admin SDK wired in backend
- **Backend deployed** — Express + Socket.IO on port 3001, Supabase for persistence

---

## 🔴 High Priority (do next)

### 1. Connect mobile to real backend
**File:** `thingy/src/socket/socketService.ts` line 14
```
BACKEND_URL = null  ← set this to your server IP / deployed URL
```
Until this is set, the app runs entirely on mocks. One line change.

### 2. Daily login streak
- Track `last_login_date` + `streak_count` in Supabase `profiles` table
- On app open: if yesterday → increment streak, else reset
- Reward: +25 tokens base, escalating per streak milestone (3d → 1.5×, 7d → 2×, 30d → 3×)
- Show streak counter + flame animation on HomeScreen header
- Send push notification if user hasn't opened app by 8 PM: "Don't lose your 🔥 streak!"

### 3. Ball-by-ball accuracy tracking
Currently predictions are settled but never aggregated per user.
- Add `user_prediction_stats` table: `(user_id, outcome_type, correct, total)`
- Update on every Ball Rush settlement
- Show accuracy % per outcome type on ProfileScreen
- "Your best call: SIX 🔥 — 74% accurate"

### 4. Match schedule / countdown on HomeScreen
- IPL fixture cards should show **time until match** ("Starts in 2h 35m") not just date
- Tap fixture → deep link into BallRush when match goes live
- Add "Set reminder" button → local notification 30 min before

---

## 🟡 Medium Priority

### 5. Achievements & badges
Trigger on existing game events — no new infrastructure needed beyond a DB table.

| Badge | Trigger |
|---|---|
| First Blood | First 1v1 win |
| Six Machine | 10 correct SIX predictions in Ball Rush |
| Analyst | 50 Ball Rush predictions |
| Perfect Over | All 6 balls correct in Ball Rush |
| IPL Faithful | 7-day login streak |
| Token Millionaire | 1,000,000 lifetime tokens earned |
| Season Champion | #1 on IPL season leaderboard |

- `achievements` table: `(id, user_id, badge_id, earned_at)`
- Badge grid on ProfileScreen with locked/unlocked states
- In-app banner animation when badge unlocked

### 6. Weekly leaderboard (reset every Monday)
- Separate `weekly_tokens_earned` column, reset via Supabase scheduled function
- Top 10 get bonus tokens (1st: 5000, 2nd: 2000, 3rd: 1000, 4–10: 250)
- "This week" tab on leaderboard screen alongside all-time
- Push notification Sunday evening: "You're #4 — make your move!"

### 7. Friends & challenge
- `friendships` table with accept/reject flow
- "Challenge a friend" button on ProfileScreen → direct 1v1 invite via share link
- Friends leaderboard tab (filter global board to friends only)

### 8. IPL team following
- User picks 1–3 favourite IPL teams on onboarding
- HomeScreen auto-prioritises those teams' matches
- Push notification when followed team's match goes live
- Team-specific accuracy stats: "You predict RCB matches 68% correctly"

---

## 🟢 Low Priority (post-IPL season)

### 9. VIP tiers
Bronze → Silver → Gold → Platinum based on lifetime tokens earned.
Benefits: reduced contest entry fees, exclusive contests, VIP badge.

### 10. Prediction accuracy AI tips
After 20+ Ball Rush predictions, surface personalised insight:
"You're 3× better at predicting death-over dots — focus there."

### 11. Season-end tournament
IPL season finale: top 64 users by accuracy enter a knockout bracket.
Special prize pool funded by house rake accumulated during the season.

### 12. Social sharing
- Share battle result card as image (react-native-view-shot)
- Share Ball Rush accuracy card at end of each match
- Referral code system: referred user joins → both get 200 tokens

---

## Infrastructure gaps to close

| Gap | Fix |
|---|---|
| `BACKEND_URL = null` | Set to deployed URL — blocks everything real |
| In-memory cache | Fine for now; add Redis if >500 concurrent users |
| Cricbuzz scraper for ball-by-ball | Fragile (HTML parsing); consider CricAPI `/match_info` polling at 10s as backup |
| No crash/error monitoring | Add Sentry to both backend and RN app |
| No CI | GitHub Actions: tsc + lint on PR |

---

## IPL 2026 season milestones

| Date | Target |
|---|---|
| Now | `BACKEND_URL` set, live data flowing |
| Week 1 | Login streak + match countdown live |
| Week 2 | Ball Rush accuracy tracking + first badges |
| Week 3 | Weekly leaderboard reset running |
| Week 4 | Team following + smart push notifications |
| End of season | Season tournament + social sharing |
