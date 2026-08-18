# Yands Law — Task List

**Source:** Zoom meeting 12 Aug (meeting.md) + AI.docx (1 Aug) + client email on multi-tenant architecture
**Last updated:** 17 Aug

> **Important:** AI.docx (44 modules) long-term vision hai. **Meeting 12 Aug operative plan hai** — usne scope narrow kar diya. Client ne kaha: *"we will work one by one... only running cases"* aur *"we need only two things — basic and file data."*
> Abhi 44 modules pe kaam nahi karna.

---

## Decided — dobara discuss nahi karna

| Item | Decision |
|---|---|
| Backend | Banega. Client: *"it's about you"* — approved |
| Deployment | Same existing server |
| SaaS model | Confirmed — doosri law firms ko becha jayega |
| Architecture | Multi-tenant. Har firm ka apna domain + apna DB + apni storage + apna AI index |
| Shared layer | Sirf public legal data (Oman courts, governorates, procedures) — read-only |
| AI training | Kabhi bhi combined data pe single model train nahi karna. Per-firm RAG only |
| Domain | `yandslaw` — kharida ja chuka, 3 saal ke liye |
| Payment gateway | Stripe — Oman mein available (Morocco mein nahi). Isi ko use karenge |
| Copilot | Rejected — ye tasks handle nahi karega |
| AI model | Pehle research/PoC, phir decide |

---

## Blocked — client se chahiye

- [ ] **Running Case ke final UI changes** — client ne 12 Aug ko kaha *"give me one day"*. Ab tak nahi aaya. **Ye Phase 1 block kar raha hai — follow up karein**
- [ ] **Data cleanup rules** — kya delete karna hai exactly? Sirf test entries, ya related data bhi?
- [ ] **30–50 Arabic sample court documents** — claims, judgments, defense memos (clean PDF + scans). Email mein maang chuke hain. Phase 2 ka lead-time item

---

## Phase 1 — Abhi (Running Cases + Backend)

### Data
- [ ] Wrong / duplicate entries delete karein (client: *"please delete all data there"* — 2 projects ka issue)
- [ ] Clean state confirm karein, phir proper structure se data entry start

### Running Cases — UI
- [ ] `+` button remove
- [ ] Arabic name field — ek hi rakhein, extra remove
- [ ] Layout / field arrangement revise (client ke final changes ka intezaar)

### Basic Data + File Data
> Sirf ye do tabs. Baaki modules baad mein.
- [ ] Basic Data — structure review + fields finalize
- [ ] File Data — structure review + fields finalize
- [ ] Add / edit / view functionality
- [ ] Test → client review → fix

### Backend
- [ ] Stack + multi-tenant DB schema (din-1 se multi-tenant)
- [ ] Auth + role-based access
- [ ] Reference data tables — Oman courts, governorates, wilayats, case statuses
      (abhi `src/pages/litigation/CaseDetail.jsx` mein hardcoded hai, DB mein nikalna hai)
- [ ] Cases CRUD API
- [ ] Frontend ko localStorage se hataakar server pe lana
- [ ] Document storage (real upload — abhi buttons UI-only hain)
- [ ] Async job queue (OCR / LLM calls ke liye — baad mein zaroori hoga)
- [ ] Audit log — din se on (baad mein add kiya to purana record kabhi nahi milega)
- [ ] Same server pe deploy

### Baaki
- [ ] **Branding separation** — client: current system doosri firm ke saath structure share karta hai. Sirf logo change kaafi nahi, koi connection nahi hona chahiye
- [ ] **Invoice approval option** — client khud add kare to approval nahi; koi aur add kare to approve button aaye (role-based)
- [ ] **Final Excel sheet** — client ne bheji thi, deliver hui ya nahi? Check karein

---

## Phase 2 — Running Cases test hone ke baad

- [ ] **AI Case Search** — filters ki jagah/saath AI search box
      Client ka example: *"cases for Muscat which are still in primary"*
      Flow: natural language → filters → table mein results
- [ ] **Update → Auto Task** — case update padh kar khud task banaye
      Client ka example: *"next hearing for our reply"* → task create
      Date detect ho to due date bhi set kare
- [ ] **AI model research / PoC** — kaunsa model kis task ke liye
- [ ] **Arabic OCR accuracy PoC** — sample documents pe test. Ship nahi karna, sirf real accuracy number nikalna
- [ ] **Smart deadline alerts** (Green/Yellow/Red) — data pehle se maujood hai (`next_date`, `follow_date`), koi OCR nahi chahiye. Sab se aasan pehla AI win

---

## Phase 3 — Microsoft integration

- [ ] Email → Case automation (Microsoft 365)
- [ ] OneDrive — attachment save + case se link
- [ ] Error handling

> Shakaib ne meeting mein warning di thi: third-party integration mein masle aate hain (WhatsApp ka tajurba). Client ne kaha *"no problem, we start, we try."*
> Trigger mechanism (webhook / polling) abhi decide nahi hua.

---

## Phase 4 — SaaS layer

- [ ] **Super Admin dashboard** — kitni firms, kaun active, subscription baqi, payment status, AI usage
- [ ] **Subscription plans** — 3 / 6 / 9 / 12 months, 2 saal, 3 saal (chhote plan ka rate zyada)
- [ ] **Recurring payment** — Stripe, automatic deduction
      (client ne bank card offer kiya tha, Shakaib ne mana kiya — proper auto-deduct mechanism chahiye)
- [ ] **AI usage limits** — per plan quota (API cost control)
- [ ] **Tenant provisioning** — nayi firm onboard karna automated ho, manual nahi

---

## Notes

- **Monthly retainer hai** — har mahine client ko kuch **dikhna** chahiye. Backend ka kaam 3–4 mahine invisible rehta hai. Har mahine ek visible cheez zaroor ship karein (isi liye smart deadline alerts Phase 2 mein upar rakhe hain — wo Phase 1 ke beech mein bhi ship ho sakta hai).
- **Client ka method:** ek section develop → test → review → fix → phir agla. Ek saath sab modules nahi.
- **Breeze Drive alag project hai** — client ne meeting mein clarify kiya, is se koi taalluq nahi.
- **Report tab** — client ne clarify kiya ke jo wo "report" kehta hai wo actually updates + dates hain jo list mein aate hain. "Basic data" wo hai jo file open karte waqt bharte hain.
