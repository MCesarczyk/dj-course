# Wardley Map — Microsoft | Wartość dla Klientów Korporacyjnych
**Perspektywa: CIO/CTO dużej organizacji | 2025**

---

## MAPA GŁÓWNA

```
  WIDOCZNOŚĆ
  DLA KLIENTA
  (C-suite / biznes)
        ↑
        │
  [AN]  │  ★ PRZEWAGA KONKURENCYJNA       ★ BEZPIECZEŃSTWO          ★ EFEKTYWNOŚĆ
        │    PRZEZ AI                       I COMPLIANCE               OPERACYJNA
        │    ("Wyprzedź rynek")             ("Nie trafi na okładki")   ("Rób więcej, taniej")
        │
  [BC]  │         ○ AI-augmented         ○ Ochrona przed      ○ Automatyzacja
        │           workforce              cyberzagrożeniami    procesów biznes.
        │           (Copilot w pracy)      (Defender, Sentinel)
        │
  [AP]  │  ○ Autonomous    ○ M365       ○ Dynamics 365    ○ Power       ○ GitHub
        │    AI Agents       Copilot      (CRM / ERP)       Platform      Copilot
        │    (Studio)
        │
  [PS]  │  ○ Azure        ○ Microsoft   ○ Microsoft     ○ Azure       ○ Azure
        │    OpenAI          Fabric        Entra ID /      DevOps        Kubernetes
        │    Service         (analytics)   Defender        / GitHub        Service
        │                                  for Cloud       Actions
        │
  [IN]  │                  ○ Microsoft 365  ○ Teams       ○ Windows    ○ Active
        │                    (Office suite)   (comm.)       Server        Directory
        │                                                  Enterprise
        │
  [FI]  │                                ○ Azure Compute  ○ Azure      ○ Global
        │                                  (VMs, AKS)       Storage      Datacenter
        │                                                               Network
        │
  ──────┼────────────────────────────────────────────────────────────────────────→
      Genesis              Custom               Product             Commodity
    (pionierskie,        (budowane na         (kupujesz           (standard,
     niestabilne,         miarę, wzorce        gotowe,             media,
     R&D, ryzyko)         w toku)              konfiguru.)         utility)
```

**Legenda poziomów Y:**
`AN` = Anchor (potrzeby C-suite)
`BC` = Business Capability (co widzą działy)
`AP` = Application/Product (co kupuje IT)
`PS` = Platform Service (co budują architekci)
`IN` = Infrastructure nadbudowana (niewidoczna dla biznesu)
`FI` = Fizyczna infrastruktura (całkowicie niewidoczna)

---

## MAPA SZCZEGÓŁOWA — POZYCJE KOMPONENTÓW

### Anchors — czego naprawdę chce klient korporacyjny

| Anchor | Opis | Gdzie Microsoft wchodzi |
|--------|------|------------------------|
| ★ Przewaga przez AI | CEO chce być "AI-first" zanim zrobi to konkurencja | Copilot + Azure OpenAI |
| ★ Bezpieczeństwo & Compliance | CISO boi się breachów, regulatorów (NIS2, DORA, GDPR) | Defender, Sentinel, Entra, Purview |
| ★ Efektywność operacyjna | CFO chce ciąć koszty, automatyzować | Power Platform, M365, Azure |

---

### Genesis — pionierskie, niestabilne, R&D

```
┌──────────────────────────────────────────────────────────────┐
│  GENESIS — "kupujesz eksperyment, nie produkt"               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ Autonomous AI Agents (Copilot Studio)                     │
│    Agenty AI które działają samodzielnie (planują, wykonują, │
│    wchodzą w interakcje z systemami). Wzorce dopiero         │
│    się kształtują. Microsoft sam odkrywa co działa.          │
│    → Klient kupuje: "być pierwszym w niszy"                  │
│                                                              │
│  ○ Small Language Models — Phi-4 / Phi-3                     │
│    Małe modele na edge/on-premise. Nowe zastosowania:        │
│    lokalne przetwarzanie danych wrażliwych bez chmury.       │
│    → Klient kupuje: AI bez wychodzenia z firewalla           │
│                                                              │
│  ○ Copilot for Security                                      │
│    AI analizujący incydenty bezpieczeństwa w czasie          │
│    rzeczywistym. Rynek dopiero uczy się jak ufać AI w SOC.   │
│    → Klient kupuje: "SOC analyst 10x szybszy"                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Dlaczego Genesis?**
Brak ugruntowanych wzorców wdrożenia. Duże ryzyko. ROI niepewne.
Early adopters płacą premium i dostają competitive edge — albo tracą czas.

---

### Custom — budowane na miarę, wzorce w toku

```
┌──────────────────────────────────────────────────────────────┐
│  CUSTOM — "wzorce istnieją, ale każdy wdraża inaczej"        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ Microsoft 365 Copilot                                     │
│    AI w Teams, Word, Excel, Outlook. Wzorce adopcji dopiero  │
│    się ustalają — organizacje wciąż uczą się jak to          │
│    integrować z procesami. Szybko dojrzewa → Product.        │
│    Cena: $30/user/mies. — premium nad M365                   │
│                                                              │
│  ○ Azure OpenAI Service                                      │
│    GPT-4o, o3 dostępne przez Azure API z gwarancjami SLA,    │
│    data residency (EU), bez trenowania na Twoich danych.     │
│    Organizacje budują custom chatboty, RAG, pipelines.       │
│    → Klient kupuje: "OpenAI ale w naszym VPC"                │
│                                                              │
│  ○ Microsoft Fabric                                          │
│    Ujednolicona platforma analityczna (Data Factory +        │
│    Synapse + Power BI + Lakehouse w jednym). Relatywnie      │
│    nowa (2023). Wiele org. wciąż migruje z osobnych         │
│    narzędzi.                                                 │
│    → Klient kupuje: "jedno miejsce na całe dane firmy"       │
│                                                              │
│  ○ GitHub Copilot (Enterprise)                               │
│    AI pair programmer w IDE. Wzorce governance, IP policy,   │
│    code review AI — wciąż ewoluują. Rynek przyzwyczaja       │
│    się do AI w loop developerskim.                           │
│    → Klient kupuje: "developer 30–55% szybszy"               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Dlaczego Custom?**
Produkty istnieją, ale wdrożenie wymaga znaczącej pracy integracyjnej, change management, governance. Nie "kliknij i działa".

---

### Product — dojrzałe, standaryzowane, kupujesz i konfigurujesz

```
┌──────────────────────────────────────────────────────────────┐
│  PRODUCT — "rynek wie czego chce, dostawca wie co sprzedaje" │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ Azure Cloud Platform (ogółem)                             │
│    200+ usług. IaaS/PaaS/SaaS. Zrozumiałe modele cenowe.    │
│    Konkuruje z AWS/GCP — rynek zdecydowany. Lider w         │
│    enterprise (kontrakt z OpenAI = differentiator).          │
│                                                              │
│  ○ Dynamics 365 (CRM + ERP)                                  │
│    Konkurent Salesforce i SAP. Zintegrowany z M365/Teams.   │
│    Wzorce wdrożeniowe ustalone, partnerzy certyfikowani.     │
│    → Klient kupuje: "CRM który rozumie moje maile"           │
│                                                              │
│  ○ Power Platform                                            │
│    Power BI (BI/analytics) + Power Apps (low-code apps)      │
│    + Power Automate (workflow) + Copilot Studio.             │
│    Citizen developer tooling — dobrze zdefiniowany rynek.   │
│    → Klient kupuje: "IT bez IT dla działów biznesowych"      │
│                                                              │
│  ○ GitHub (Enterprise)                                       │
│    Source control + CI/CD + security scanning + Projects.    │
│    De facto standard dla dev teams. Przejęty 2018.           │
│    → Klient kupuje: "jeden hub dla całego SDLC"              │
│                                                              │
│  ○ Azure Kubernetes Service / Azure DevOps                   │
│    Managed K8s + CI/CD pipelines. Dojrzałe, certyfikowane.  │
│    Rynek wie jak to wycenić i wdrożyć.                       │
│                                                              │
│  ○ Microsoft Entra ID + Defender for Cloud                   │
│    Identity (SSO, MFA, Conditional Access) + Cloud Security. │
│    Produktowe — każda enterprise org ma lub powinna mieć.   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Commodity — standard branżowy, niewidoczny, utility

```
┌──────────────────────────────────────────────────────────────┐
│  COMMODITY — "oczekiwane, nikt nie pyta dlaczego to masz"    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ○ Microsoft 365 (Office suite — Word, Excel, PPT, Outlook)  │
│    Biurowy standard. Klient nie pyta "czy mieć?", pyta       │
│    "jaki plan?". 345M płatnych użytkowników.                 │
│                                                              │
│  ○ Microsoft Teams (komunikacja)                             │
│    Post-COVID stał się commodity. Każda org ma Teamsów.      │
│    Konkuruje ze Slack — ale w enterprise wygrał domyślnością.|
│                                                              │
│  ○ Active Directory / Windows Server                         │
│    Legacy core każdej korporacji. Niewidoczne, niezastąpione,│
│    "po prostu działa". Migracja do Entra ID trwa latami.     │
│                                                              │
│  ○ Windows 11 Enterprise                                     │
│    OS jako utility. Klient nie wybiera — to default          │
│    korporacyjny, zarządzany przez Intune.                    │
│                                                              │
│  ○ Azure Compute (VMs) / Azure Storage / Azure Networking    │
│    Infrastruktura jako media. Cena na godzinę, elastyczna.   │
│    Nieodróżnialna funkcjonalnie od AWS EC2 / S3.             │
│                                                              │
│  ○ Email (Exchange Online)                                   │
│    Poczta korporacyjna. Utility. Nikt nie ekscytuje się      │
│    "nowym emailem".                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## CO WIDZI KLIENT KORPORACYJNY, A CO NIE

```
╔═══════════════════════════════════════════════════════════════════╗
║  CEO / CFO / CISO WIDZĄ (i za to płacą, o tym rozmawiają)        ║
║                                                                   ║
║   • "Copilot przyspiesza pracę zespołu o X%"                      ║
║   • "Defender wykrył i zablokował atak ransomware"                ║
║   • "Power BI dashboard z KPI dla zarządu"                        ║
║   • "Teams — cała firma komunikuje się w jednym miejscu"          ║
║   • "Azure OpenAI — zbudowaliśmy chatbota dla klientów"           ║
╠═══════════════════════════════════════════════════════════════════╣
║  DZIAŁY IT / ARCHITEKCI WIDZĄ (ale biznes nie)                    ║
║                                                                   ║
║   • Azure Kubernetes Service, DevOps pipelines                    ║
║   • Microsoft Fabric — lakehouse, dataflows, semantic model       ║
║   • Entra ID — Conditional Access policies, MFA enforcement       ║
║   • GitHub Copilot — developer tooling                            ║
║   • Azure OpenAI — modele, RAG pipelines, prompt engineering      ║
╠═══════════════════════════════════════════════════════════════════╣
║  CAŁKOWICIE NIEWIDOCZNE (ale gdyby padło — wszyscy by poczuli)    ║
║                                                                   ║
║   • Azure compute — VM, containers, networking                    ║
║   • Azure Storage — blob, queues, tables                          ║
║   • Global datacenter network — 60+ regionów                      ║
║   • Active Directory — fundament tożsamości korporacyjnej          ║
║   • Windows Server — działa w tle w każdym korytarzu              ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## EWOLUCJA MAPY — JAK ZMIENIA SIĘ W CZASIE

### Ruch komponentów na osi X (prawo = dojrzewanie)

```
                                                         → czas →

  Autonomous AI Agents      [Genesis]  ─────────────────→ [Custom]
  (Copilot Studio)          Niestabilne, R&D              Wzorce wdrożeń 2026-27

  Microsoft 365 Copilot     [Custom]   ──────────────────→ [Product]
                            Wciąż eksperyment              Standard enterprise 2026

  GitHub Copilot            [Custom]   ──────────────────→ [Product]
                            Governance nieuregulowane       Standardowe tooling 2026

  Azure OpenAI Service      [Custom]   ──────────────────→ [Product]
                            Wzorce RAG/fine-tuning         Platformized 2027

  Microsoft Fabric          [Custom]   ──────────────────→ [Product]
                            Migracje trwają               Analytics standard 2027

  Azure Cloud (ogółem)      [Product]  ──────────────────→ [Commodity]
                            Zróżnicowany vs AWS            Utility 2028+

  Teams                     [Product]  ──────────────────→ [Commodity]
                            Wygrywa przez lock-in           Poczta nowej ery

  M365 (Office suite)       [Commodity] ──────────────────→ [głębszy Commodity]
                            Już standard                   Invisible utility
```

### Nowe komponenty wchodzące na mapę (Genesis 2025-2026)

```
  ○ AI PC / Copilot+ PC
    Lokalne SLM na NPU (Neural Processing Unit) w laptopach.
    Recall, live captions, local AI. Prywatność bez chmury.
    → wchodzi z Genesis, zmierza ku Custom

  ○ Copilot Actions / Multi-agent orchestration
    Agenty AI współpracujące ze sobą bez człowieka w pętli.
    Jeszcze R&D — Microsoft Build 2024 zapowiedź.
    → głęboki Genesis, ryzykowne ale transformacyjne

  ○ Microsoft Mesh (VR/AR collaboration)
    3D spotkania w Teams / HoloLens. Wciąż niszowe.
    Przesuwa się wolno — rynek nie gotowy masowo.
    → Genesis, może utknąć
```

---

## STRATEGIA MICROSOFTU — CO MAPA MÓWI O MODELU BIZNESOWYM

### 1. Gravity well — pull przez lock-in

```
  M365 (Commodity) ──→ Teams ──→ M365 Copilot ──→ Azure OpenAI
  [klient płaci $12]   [gratis]  [klient płaci $30 extra]  [Azure $$]

  Commodity jako haczyk. AI jako upsell.
  Każde nowe AI-feature jest droższe niż poprzednie —
  ale klient jest już inside the gravity well.
```

### 2. AI wszędzie — pozioma ekspansja

```
  Word + Copilot         → wyższy ARPU z M365
  Teams + Copilot        → wyższy ARPU z Teams
  GitHub + Copilot       → wyższy ARPU z GitHub
  Dynamics + Copilot     → wyższy ARPU z Dynamics
  Azure + OpenAI         → wyższy ARPU z Azure

  Microsoft nie sprzedaje AI jako osobnego produktu.
  Sprzedaje AI jako warstwę na każdym produkcie który już masz.
  To pozioma ekspansja przychodu bez poziomej ekspansji klientów.
```

### 3. Pozycja w każdej warstwie mapy

```
  ┌─────────────────────────────────────────────────────┐
  │ Warstwa    │ Microsoft    │ Główny konkurent         │
  ├────────────┼──────────────┼─────────────────────────┤
  │ AI/LLM     │ Azure OpenAI │ AWS Bedrock / GCP Vertex │
  │ Productivity│ M365 Copilot │ Google Workspace AI      │
  │ Dev tools  │ GitHub       │ GitLab, Atlassian        │
  │ Cloud      │ Azure        │ AWS (lider), GCP         │
  │ Security   │ Defender/Entra│ CrowdStrike, Okta       │
  │ Analytics  │ Fabric/PBI   │ Databricks, Snowflake    │
  │ CRM/ERP    │ Dynamics 365 │ Salesforce, SAP          │
  │ OS/Infra   │ Windows/AD   │ Linux (rosnący udział)   │
  └─────────────────────────────────────────────────────┘

  Jedyna firma która jest TOP-3 w każdej z tych warstw jednocześnie.
  To jest moat Microsoftu — nie żaden pojedynczy produkt.
```

---

## PEŁNA MAPA Z EWOLUCJĄ (widok połączony)

```
  WIDOCZNOŚĆ
        ↑
        │
  [AN]  │  ★ AI-driven competitive advantage  ★ Security/Compliance  ★ Cost efficiency
        │
  [BC]  │        ○ AI workforce          ○ Cyber protection      ○ Process automation
        │          augmentation
        │
  [AP]  │  ○ Autonomous    ○ M365        ○ GitHub      ○ Dynamics   ○ Power
        │    AI Agents       Copilot ──→   Copilot ──→   365          Platform
        │    (Studio)   ──→  [Product]     [Product]
        │    [Genesis→Custom]
        │
  [PS]  │  ○ Azure      ○ Microsoft    ○ Entra ID /  ○ Azure      ○ Azure
        │    OpenAI ──→   Fabric ──→     Defender      DevOps/      Kubernetes
        │    [Product]    [Product]       [Product→    GitHub ──→   [Product]
        │                                Commodity]    [Product]
        │
  [IN]  │                ○ M365          ○ Teams ──→              ○ Windows
        │                  (Office) ──→    [Commodity]              Server/AD
        │                  [Commodity]                              [Commodity]
        │
  [FI]  │                              ○ Azure VM/Storage/Network ──→ [Commodity]
        │                                ○ Global Datacenter Network [Commodity]
        │
  ──────┼──────────────────────────────────────────────────────────────────────→
      Genesis            Custom              Product            Commodity
```

**`──→` oznacza kierunek ewolucji w ciągu 2–3 lat**

---

## WNIOSKI — CO MAPA MÓWI O MICROSOFCIE

**1. Microsoft nie sprzedaje produktów — sprzedaje platformę.**
Żaden produkt MS nie ma sensu osobno. Sens mają razem — to celowa architektura ekosystemu.

**2. AI przesuwa się szybciej niż kiedykolwiek z Genesis do Product.**
M365 Copilot ma rok, już jest Product-ready. Historycznie to zajmowało 5-7 lat.

**3. Commodity to nie słabość — to zakotwiczenie.**
Windows, Office, Teams są commodity — ale to jest powód dla którego klient nigdy nie odejdzie. To fundament na którym buduje się upsell.

**4. Azure jest strategicznym centrum — nie najlepszym IaaS.**
AWS ma więcej usług i większy udział. Azure wygrywa przez integrację z M365 i relacje enterprise. OpenAI deal = differentiator który AWS nie ma.

**5. Największe ryzyko dla Microsoftu: Google Workspace + Gemini.**
Jeśli Google skutecznie powtórzy model "AI w każdym narzędziu" — może zaatakować commodity warstwę (email, docs) od dołu.

---

*Źródła: Microsoft Annual Report 2024, Azure product page, M365 roadmap, GitHub Octoverse 2024*
*Metodologia: Wardley Mapping (Simon Wardley)*
*Data: 2025-05-02*
