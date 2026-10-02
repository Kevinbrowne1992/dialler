# Simple User Guide for Zoiper Outbound Dialler

Welcome! This tool makes making phone calls from an Excel or CSV file fast and effortless. You will never have to copy and paste or manually dial a phone number again.

---

## 🚀 Choose Your Version

You have two easy ways to use this program:

### Version 1: The 1-Click File (`ZoiperDialler.html`) — *Easiest (No Installation)*
- **What it is**: A single file that opens right inside your web browser (Google Chrome or Microsoft Edge).
- **How to start**:
  1. Find the file named **`ZoiperDialler.html`** (located in the `releases/` folder).
  2. **Double-click** it.
  3. It will immediately open in your browser. That's it!
- **First time you click a call**:
  - A small box may appear asking: *"Open Zoiper?"*
  - **Check the box** that says: **"Always allow this site to open these types of links"**
  - Click **Open**.
  - *From that moment on, every call will happen instantly with zero popups!*

---

### Version 2: The Windows Desktop App (`.exe`)
- **What it is**: A regular Windows program that runs in its own window on your desktop.
- **Where to find it**: Inside the `dist-electron/` folder.
- **How to start**:
  - **Option A (No Install needed)**: Double-click **`Zoiper Outbound Dialler 1.0.0.exe`**. It opens right away without installing anything.
  - **Option B (Installer)**: Double-click **`Zoiper Outbound Dialler Setup 1.0.0.exe`**. It installs an icon directly onto your Windows Desktop and Start Menu.

---

## 📞 How to Make Calls (Step-by-Step)

### Step 1: Open Zoiper
Before you start calling, open **Zoiper** on your computer and make sure your headset is connected and you are logged into your phone account.

### Step 2: Open the Dialler
Open either **`ZoiperDialler.html`** or the **Windows Desktop App**.

### Step 3: Load Your Contacts
You have two choices:
- Click the green **"Choose Spreadsheet"** button and select your `.xlsx`, `.xls`, or `.csv` file.
- Or simply **drag and drop** your spreadsheet file anywhere on the screen!
- *(Want to practice first? Click the **"Load Demo Data"** button to try it out with test contacts).*

### Step 4: Call Your Contacts!
- **Double-click** any row in the list to immediately place a call.
- Or click the **green round phone button** on the right side of the row.
- The row will briefly glow green to show you who you are calling, and a note will appear at the bottom: *"Dialing [Name] via Zoiper..."*
- **Quick Tip**: You can also press the **`D`** key on your keyboard to instantly call the next person on your list!

### Step 5: (Optional) Keep Track of Your Results
- Once you dial someone, a dropdown menu appears next to their name.
- You can select: **Connected**, **Left Voicemail**, **No Answer**, or **Busy**.
- At the top of your screen, a progress bar shows you how many calls you have made and how many are left.

### Step 6: Save Your Work
When you finish your calling session, click the **"Export Report"** button at the top. It downloads an updated spreadsheet containing the date, time, and outcome of each call.

---

## ❓ Frequently Asked Questions

#### 1. What if my spreadsheet headers are named differently?
The dialler automatically looks for columns like *Phone, Mobile, Telephone, Name, Company, Email*. 
If it doesn't recognize your columns, a yellow **"Column Mapping"** box will appear. Simply select which column is the **Phone Number** from the dropdown menu and click **Apply Mapping**.

#### 2. Zoiper opens, but it doesn't start dialing automatically. How do I fix this?
In Zoiper:
1. Click the **Gear icon** (Settings/Preferences).
2. Go to **Automation** (or **Integrations**).
3. Make sure **"Automatically dial on protocol link click"** is **checked**.

#### 3. Is my contact list safe?
**Yes, 100%!** This program runs entirely on your own computer. None of your contacts or phone numbers are ever sent over the internet or uploaded to any server.
