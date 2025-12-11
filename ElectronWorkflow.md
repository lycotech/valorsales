# **ELECTRON DESKTOP APPLICATION WORKFLOW**

## **Converting ValorSales to Installable Desktop POS System**

This document outlines the workflow for converting the existing Next.js web application into an Electron-based desktop application with POS (Point of Sale) features for supermarket operations.

---

## **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Phase 1: Electron Setup](#phase-1-electron-setup)
4. [Phase 2: Offline-First Architecture](#phase-2-offline-first-architecture)
5. [Phase 3: POS Module Development](#phase-3-pos-module-development)
6. [Phase 4: Hardware Integration](#phase-4-hardware-integration)
7. [Phase 5: Desktop-Specific Features](#phase-5-desktop-specific-features)
8. [Phase 6: Build & Distribution](#phase-6-build--distribution)
9. [Phase 7: Auto-Updates & Maintenance](#phase-7-auto-updates--maintenance)
10. [Estimated Timeline](#estimated-timeline)

---

## **OVERVIEW**

### **Goals**

- Convert Next.js web app to Electron desktop application
- Add POS-specific features for supermarket operations
- Enable offline functionality with data sync
- Integrate hardware (barcode scanners, receipt printers, cash drawers)
- Create installable packages for Windows, macOS, and Linux

### **Tech Stack Additions**

| Component         | Technology                                   |
| ----------------- | -------------------------------------------- |
| Desktop Framework | Electron 29+                                 |
| Build Tool        | electron-builder                             |
| Local Database    | SQLite (via better-sqlite3) or IndexedDB     |
| Sync Engine       | Custom sync service with conflict resolution |
| Hardware Bridge   | node-usb, node-thermal-printer, escpos       |
| Auto Updates      | electron-updater                             |
| IPC Communication | Electron IPC (Main ↔ Renderer)              |

---

## **ARCHITECTURE DESIGN**

### **Application Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Window Mgmt  │  │ Hardware API │  │ Local Database   │  │
│  │ (BrowserWin) │  │ (Printers,   │  │ (SQLite/IndexDB) │  │
│  │              │  │ Scanners)    │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auto Updater │  │ Sync Service │  │ System Tray      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    IPC BRIDGE (Preload)                      │
├─────────────────────────────────────────────────────────────┤
│                   ELECTRON RENDERER PROCESS                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │              NEXT.JS APPLICATION                        ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐  ││
│  │  │ POS     │ │ Sales   │ │ Invent  │ │ Reports     │  ││
│  │  │ Terminal│ │ Module  │ │ Module  │ │ Module      │  ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow Architecture**

```
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   LOCAL DB   │◄──────►│  SYNC ENGINE │◄──────►│  CLOUD DB    │
│   (SQLite)   │        │              │        │  (MySQL)     │
└──────────────┘        └──────────────┘        └──────────────┘
       ▲                       ▲                       ▲
       │                       │                       │
       │ Offline Mode          │ Background            │ Online Mode
       │ (Immediate)           │ Sync                  │ (Fallback)
       │                       │                       │
       └───────────────────────┴───────────────────────┘
```

---

## **PHASE 1: ELECTRON SETUP**

### **Task 1.1: Project Structure**

- [ ] Create `/electron` folder in project root
- [ ] Set up Electron main process entry (`electron/main.ts`)
- [ ] Create preload script (`electron/preload.ts`)
- [ ] Configure TypeScript for Electron (`electron/tsconfig.json`)

**Folder Structure:**

```
electron/
├── main.ts              # Main process entry
├── preload.ts           # Preload script (IPC bridge)
├── tsconfig.json        # Electron TypeScript config
├── menu.ts              # Application menu
├── tray.ts              # System tray setup
├── ipc/
│   ├── database.ts      # Database IPC handlers
│   ├── hardware.ts      # Hardware IPC handlers
│   ├── sync.ts          # Sync IPC handlers
│   └── system.ts        # System IPC handlers
├── services/
│   ├── database.ts      # SQLite database service
│   ├── sync.ts          # Sync service
│   ├── printer.ts       # Printer service
│   ├── scanner.ts       # Barcode scanner service
│   └── updater.ts       # Auto-update service
└── utils/
    ├── paths.ts         # App paths helper
    └── logger.ts        # Desktop logging
```

### **Task 1.2: Dependencies Installation**

```bash
# Electron core
pnpm add electron electron-builder -D
pnpm add electron-serve electron-store

# Database
pnpm add better-sqlite3
pnpm add -D @types/better-sqlite3

# Hardware integration
pnpm add node-thermal-printer escpos escpos-usb
pnpm add serialport usb

# Auto updates
pnpm add electron-updater

# Build tools
pnpm add -D electron-rebuild concurrently wait-on
```

### **Task 1.3: Package.json Scripts**

```json
{
  "main": "electron/dist/main.js",
  "scripts": {
    "electron:dev": "concurrently \"pnpm dev\" \"wait-on http://localhost:3000 && electron .\"",
    "electron:build": "pnpm build && electron-builder",
    "electron:build:win": "pnpm build && electron-builder --win",
    "electron:build:mac": "pnpm build && electron-builder --mac",
    "electron:build:linux": "pnpm build && electron-builder --linux",
    "postinstall": "electron-rebuild"
  }
}
```

### **Task 1.4: Electron Builder Configuration**

Create `electron-builder.yml`:

```yaml
appId: com.valorsales.pos
productName: ValorSales POS
copyright: Copyright © 2024 ValorSales

directories:
  output: dist-electron
  buildResources: build

files:
  - electron/dist/**/*
  - .next/**/*
  - public/**/*
  - package.json

win:
  target:
    - target: nsis
      arch: [x64, ia32]
  icon: build/icon.ico

mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  icon: build/icon.icns
  category: public.app-category.business

linux:
  target:
    - target: AppImage
    - target: deb
  icon: build/icon.png
  category: Office

nsis:
  oneClick: false
  perMachine: true
  allowToChangeInstallationDirectory: true
  installerIcon: build/installer.ico
  uninstallerIcon: build/uninstaller.ico
  license: LICENSE.md

publish:
  provider: github
  owner: your-org
  repo: valorsales-pos
```

### **Task 1.5: Main Process Setup**

Create `electron/main.ts`:

- [ ] Initialize BrowserWindow with Next.js app
- [ ] Set up electron-serve for production
- [ ] Configure window settings (size, position, kiosk mode option)
- [ ] Implement window state persistence
- [ ] Set up application menu
- [ ] Initialize system tray
- [ ] Register global shortcuts

### **Task 1.6: Preload Script & IPC**

Create `electron/preload.ts`:

- [ ] Expose safe APIs via contextBridge
- [ ] Create IPC channels for:
  - Database operations
  - Hardware control
  - System info
  - File operations
  - Sync triggers

---

## **PHASE 2: OFFLINE-FIRST ARCHITECTURE**

### **Task 2.1: Local Database Setup**

**SQLite Schema (mirror of cloud database):**

- [ ] Create local SQLite database file
- [ ] Mirror essential tables:
  - Products (for quick product lookup)
  - Customers (for customer lookup)
  - Sales (for offline sales)
  - SaleItems (for sale line items)
  - Inventory (for stock tracking)
  - SyncQueue (for pending syncs)
- [ ] Add sync metadata columns (syncStatus, lastSynced, version)

**Schema additions for sync:**

```sql
-- Add to each synced table
ALTER TABLE products ADD COLUMN sync_status TEXT DEFAULT 'synced';
ALTER TABLE products ADD COLUMN local_updated_at DATETIME;
ALTER TABLE products ADD COLUMN cloud_version INTEGER DEFAULT 0;

-- Sync queue table
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  data TEXT, -- JSON payload
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  status TEXT DEFAULT 'pending' -- pending, syncing, failed, synced
);
```

### **Task 2.2: Data Sync Service**

Create `electron/services/sync.ts`:

- [ ] Implement background sync worker
- [ ] Queue-based sync operations
- [ ] Conflict resolution strategy:
  - Server wins for master data (products, customers)
  - Client wins for transactions (sales, payments)
  - Manual resolution for conflicts
- [ ] Sync status indicators in UI
- [ ] Retry logic with exponential backoff
- [ ] Batch sync for efficiency

**Sync Flow:**

```
1. On transaction → Save to local DB + Add to sync queue
2. Every 30 seconds (configurable) → Process sync queue
3. If online → Push to cloud API
4. If offline → Queue continues to grow
5. On reconnect → Bulk sync pending items
6. After sync → Update sync status
```

### **Task 2.3: Offline Detection**

- [ ] Implement network status monitoring
- [ ] Graceful degradation when offline
- [ ] Visual indicator for online/offline status
- [ ] Queue display for pending syncs

### **Task 2.4: Data Caching Strategy**

- [ ] Initial full sync on first launch
- [ ] Incremental sync for updates
- [ ] Product catalog pre-caching
- [ ] Image caching for product photos
- [ ] Configurable sync intervals

---

## **PHASE 3: POS MODULE DEVELOPMENT**

### **Task 3.1: POS Terminal Interface**

Create `/src/app/(dashboard)/pos/page.tsx`:

- [ ] Full-screen POS layout
- [ ] Product grid with categories
- [ ] Quick search by name/barcode
- [ ] Cart/basket display
- [ ] Quantity controls (+/-)
- [ ] Price override (with permission)
- [ ] Discount application
- [ ] Customer selection
- [ ] Hold/recall transaction

**POS Screen Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]    [Cashier: John]    [Online●]    [12:30 PM]  [≡]  │
├─────────────────────────────────────────────────────────────┤
│                        │                                    │
│  ┌──────────────────┐  │  ┌─────────────────────────────┐  │
│  │  PRODUCT GRID    │  │  │  CART                       │  │
│  │  ┌────┐ ┌────┐   │  │  │  ┌─────────────────────┐   │  │
│  │  │Prod│ │Prod│   │  │  │  │ Product 1    $10.00 │   │  │
│  │  │ 1  │ │ 2  │   │  │  │  │ Qty: 2       $20.00 │   │  │
│  │  └────┘ └────┘   │  │  │  └─────────────────────┘   │  │
│  │  ┌────┐ ┌────┐   │  │  │  ┌─────────────────────┐   │  │
│  │  │Prod│ │Prod│   │  │  │  │ Product 2    $15.00 │   │  │
│  │  │ 3  │ │ 4  │   │  │  │  │ Qty: 1       $15.00 │   │  │
│  │  └────┘ └────┘   │  │  │  └─────────────────────┘   │  │
│  └──────────────────┘  │  │                             │  │
│                        │  │  Subtotal:         $35.00   │  │
│  [Categories Tabs]     │  │  Tax (7.5%):        $2.63   │  │
│  [🔍 Search Bar    ]   │  │  ─────────────────────────  │  │
│                        │  │  TOTAL:            $37.63   │  │
│                        │  │                             │  │
│                        │  │  [HOLD] [CLEAR] [PAY >>>]   │  │
│                        │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Task 3.2: Barcode Scanning**

Create `/electron/services/scanner.ts`:

- [ ] USB barcode scanner support
- [ ] Keyboard wedge mode (default)
- [ ] Serial port scanner support
- [ ] Scan event handling
- [ ] Beep confirmation
- [ ] Unknown barcode handling

**Supported Scanners:**

- USB HID barcode scanners (keyboard mode)
- Serial port scanners
- Bluetooth scanners

### **Task 3.3: Payment Processing**

Create `/src/app/(dashboard)/pos/payment/page.tsx`:

- [ ] Multiple payment methods:
  - Cash (with change calculation)
  - Card (POS terminal integration)
  - Bank Transfer
  - Mobile Money
  - Split payments
- [ ] Payment tendering screen
- [ ] Change calculation
- [ ] Payment confirmation
- [ ] Transaction completion

**Payment Flow:**

```
Cart → Payment Method → Amount Entry → Confirm → Receipt → New Sale
```

### **Task 3.4: Receipt Management**

Create receipt templates:

- [ ] Standard receipt (thermal 58mm/80mm)
- [ ] Detailed receipt
- [ ] Gift receipt
- [ ] Duplicate receipt
- [ ] End-of-day summary

**Receipt Template:**

```
================================
       VALORSALES SUPERMARKET
       123 Main Street
       Tel: 0800-123-4567
================================
Date: 2024-12-11    Time: 14:30
Cashier: John       Terminal: POS-1
Receipt #: 00012345
--------------------------------
Qty  Item              Amount
--------------------------------
 2   Bread Loaf         $4.00
 1   Milk 1L            $2.50
 3   Coca-Cola 500ml    $4.50
--------------------------------
     Subtotal:         $11.00
     Tax (7.5%):        $0.83
     ========================
     TOTAL:            $11.83
     ========================
     Cash:             $20.00
     Change:            $8.17
--------------------------------
    Thank you for shopping!
       Please come again
================================
```

### **Task 3.5: Cash Management**

- [ ] Opening float entry
- [ ] Cash in/out transactions
- [ ] Drawer count functionality
- [ ] End-of-day reconciliation
- [ ] Cash discrepancy reporting
- [ ] Shift management

### **Task 3.6: Product Quick Keys**

- [ ] Configurable quick access buttons
- [ ] Favorites/frequently sold
- [ ] Category-based organization
- [ ] Drag-and-drop customization
- [ ] User-specific layouts

### **Task 3.7: Customer Display**

- [ ] Secondary display support
- [ ] Real-time item display
- [ ] Running total
- [ ] Welcome/thank you messages
- [ ] Promotional content

---

## **PHASE 4: HARDWARE INTEGRATION**

### **Task 4.1: Receipt Printer Integration**

Create `/electron/services/printer.ts`:

- [ ] Thermal printer support (ESC/POS)
- [ ] Printer auto-detection
- [ ] Multiple printer support
- [ ] Print queue management
- [ ] Error handling (paper out, offline)

**Supported Printers:**

- Epson TM-T88 series
- Star TSP100/650 series
- Citizen CT-S series
- Generic ESC/POS printers (USB/Serial/Network)

**Print Commands:**

```typescript
interface PrinterService {
  connect(): Promise<boolean>
  print(receipt: Receipt): Promise<void>
  openCashDrawer(): Promise<void>
  cut(): Promise<void>
  printBarcode(data: string): Promise<void>
  printQRCode(data: string): Promise<void>
  testPrint(): Promise<void>
}
```

### **Task 4.2: Cash Drawer Integration**

Create `/electron/services/cashDrawer.ts`:

- [ ] USB cash drawer support
- [ ] Printer-connected drawer (via kick pulse)
- [ ] Open drawer command
- [ ] Drawer status monitoring
- [ ] Automatic open on cash sale

### **Task 4.3: Barcode Scanner Configuration**

- [ ] Scanner detection
- [ ] Prefix/suffix configuration
- [ ] Scan terminator settings
- [ ] Multi-scanner support

### **Task 4.4: Customer Display (Pole Display)**

- [ ] VFD/LCD pole display support
- [ ] Item display
- [ ] Total display
- [ ] Promotional messages

### **Task 4.5: Weighing Scale Integration**

Create `/electron/services/scale.ts`:

- [ ] Serial port scale support
- [ ] Weight capture for priced-by-weight items
- [ ] Tare functionality
- [ ] Zero calibration

### **Task 4.6: Hardware Settings UI**

Create `/src/app/(dashboard)/settings/hardware/page.tsx`:

- [ ] Printer configuration
- [ ] Scanner settings
- [ ] Cash drawer settings
- [ ] Display settings
- [ ] Scale settings
- [ ] Test buttons for each device

---

## **PHASE 5: DESKTOP-SPECIFIC FEATURES**

### **Task 5.1: Kiosk Mode**

- [ ] Full-screen lock mode
- [ ] Disable system keys (Alt+Tab, Windows key)
- [ ] Admin unlock (password/card)
- [ ] Auto-start on boot
- [ ] Crash recovery

### **Task 5.2: Multi-Window Support**

- [ ] POS terminal window
- [ ] Back-office window
- [ ] Customer display window
- [ ] Kitchen display window (if applicable)

### **Task 5.3: System Tray Integration**

- [ ] Minimize to tray
- [ ] Tray menu options:
  - Open POS
  - Open Back Office
  - Sync Status
  - Check for Updates
  - Settings
  - Exit

### **Task 5.4: Keyboard Shortcuts**

| Shortcut | Action             |
| -------- | ------------------ |
| F1       | Help               |
| F2       | New Sale           |
| F3       | Search Product     |
| F4       | Hold Transaction   |
| F5       | Recall Transaction |
| F6       | Customer Lookup    |
| F7       | Price Check        |
| F8       | Void Item          |
| F9       | Discount           |
| F10      | Payment            |
| F12      | Settings           |
| Esc      | Cancel/Clear       |

### **Task 5.5: Touchscreen Optimization**

- [ ] Large touch targets
- [ ] On-screen numpad
- [ ] Swipe gestures
- [ ] Touch-friendly scrolling

### **Task 5.6: Offline Reports**

- [ ] Daily sales summary (local)
- [ ] Cash drawer report
- [ ] Product sales report
- [ ] Hourly sales breakdown
- [ ] Export to USB drive

---

## **PHASE 6: BUILD & DISTRIBUTION**

### **Task 6.1: Build Process**

```bash
# Development
pnpm electron:dev

# Production builds
pnpm electron:build:win    # Windows installer (.exe)
pnpm electron:build:mac    # macOS installer (.dmg)
pnpm electron:build:linux  # Linux packages (.AppImage, .deb)
```

### **Task 6.2: Code Signing**

**Windows:**

- [ ] Obtain code signing certificate
- [ ] Configure signtool in electron-builder
- [ ] Sign installer and executables

**macOS:**

- [ ] Apple Developer account
- [ ] Code signing certificate
- [ ] Notarization for Gatekeeper

### **Task 6.3: Installer Customization**

- [ ] Custom installer graphics
- [ ] License agreement
- [ ] Installation options
- [ ] Desktop shortcut
- [ ] Start menu entry
- [ ] Uninstaller

### **Task 6.4: Distribution Channels**

- [ ] GitHub Releases (auto-update source)
- [ ] Direct download from website
- [ ] USB drive distribution (for offline installation)
- [ ] Custom update server (optional)

---

## **PHASE 7: AUTO-UPDATES & MAINTENANCE**

### **Task 7.1: Auto-Update System**

Create `/electron/services/updater.ts`:

- [ ] Check for updates on startup
- [ ] Background update downloads
- [ ] User notification for updates
- [ ] Install update on next restart
- [ ] Rollback capability

**Update Flow:**

```
1. App checks update server (GitHub Releases)
2. If update available → Download in background
3. Show notification: "Update available"
4. User chooses: "Install Now" or "Later"
5. If "Install Now" → Quit and install
6. If "Later" → Install on next restart
```

### **Task 7.2: Crash Reporting**

- [ ] Electron crash reporter setup
- [ ] Error logging to file
- [ ] Log upload on sync
- [ ] Automatic restart after crash

### **Task 7.3: Backup & Recovery**

- [ ] Automatic local database backup
- [ ] Manual backup to USB
- [ ] Restore from backup
- [ ] Data export functionality

### **Task 7.4: License Management**

- [ ] License key validation
- [ ] Activation limits
- [ ] Feature flags by license tier
- [ ] License expiry handling

---

## **ADDITIONAL POS FEATURES**

### **Supermarket-Specific Features**

1. **Price Book Management**

   - Regular prices
   - Member prices
   - Promotional prices
   - Volume discounts

2. **Loyalty Program**

   - Customer points accumulation
   - Points redemption
   - Member discounts
   - Birthday rewards

3. **Promotions Engine**

   - Buy X Get Y Free
   - Percentage discounts
   - Bundle deals
   - Time-based promotions
   - Coupon/voucher support

4. **Returns & Exchanges**

   - Return with receipt
   - Return without receipt
   - Exchange processing
   - Refund methods

5. **Stock Management (POS)**

   - Real-time stock display
   - Low stock warnings
   - Stock lookup
   - Inter-store transfer

6. **Multi-Terminal Support**
   - Terminal identification
   - Shared settings
   - Centralized reporting
   - Load balancing

---

## **ESTIMATED TIMELINE**

| Phase     | Description                | Estimated Time  |
| --------- | -------------------------- | --------------- |
| Phase 1   | Electron Setup             | 1 week          |
| Phase 2   | Offline-First Architecture | 2 weeks         |
| Phase 3   | POS Module Development     | 3-4 weeks       |
| Phase 4   | Hardware Integration       | 2 weeks         |
| Phase 5   | Desktop-Specific Features  | 1 week          |
| Phase 6   | Build & Distribution       | 1 week          |
| Phase 7   | Auto-Updates & Maintenance | 1 week          |
| **Total** | **Complete Desktop POS**   | **11-13 weeks** |

---

## **PREREQUISITES BEFORE STARTING**

1. ✅ Complete web application (current state)
2. ✅ Stable API endpoints
3. ⬜ Finalize product catalog
4. ⬜ Define hardware requirements
5. ⬜ Obtain code signing certificates
6. ⬜ Set up update server/GitHub releases
7. ⬜ Purchase test hardware (printer, scanner, drawer)

---

## **HARDWARE REQUIREMENTS**

### **Minimum System Requirements**

| Component | Requirement                               |
| --------- | ----------------------------------------- |
| OS        | Windows 10+, macOS 10.13+, Ubuntu 18.04+  |
| CPU       | Intel i3 / AMD Ryzen 3 or equivalent      |
| RAM       | 4 GB minimum, 8 GB recommended            |
| Storage   | 500 MB for app + space for local database |
| Display   | 1024x768 minimum, touch recommended       |

### **Recommended POS Hardware**

| Device           | Model Examples                | Price Range |
| ---------------- | ----------------------------- | ----------- |
| Thermal Printer  | Epson TM-T88VI, Star TSP143   | $200-400    |
| Barcode Scanner  | Honeywell 1900g, Zebra DS2208 | $100-200    |
| Cash Drawer      | APG VB320, Star CD3           | $80-150     |
| Customer Display | Partner Tech CD-7220          | $100-200    |
| Touchscreen      | Elo 1509L 15"                 | $300-500    |

---

## **MIGRATION PATH**

### **From Web to Desktop**

1. **Parallel Operation** - Run web and desktop simultaneously
2. **Gradual Migration** - Start with one terminal
3. **Data Sync Verification** - Ensure all data syncs correctly
4. **Full Transition** - Move all operations to desktop
5. **Web as Backup** - Keep web accessible for remote access

---

## **SECURITY CONSIDERATIONS**

1. **Local Data Encryption** - Encrypt SQLite database
2. **Secure IPC** - Validate all IPC messages
3. **License Obfuscation** - Protect license validation logic
4. **Secure Storage** - Use electron-store with encryption
5. **API Security** - Continue using JWT authentication
6. **Cash Handling** - Audit trail for all cash operations

---

_Document Version: 1.0_
_Last Updated: December 11, 2025_
