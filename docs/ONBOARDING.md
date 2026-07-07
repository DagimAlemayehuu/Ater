# Welcome to Ater!

Congratulations on getting your hands on Ater! Ater is your personal study operating system designed to help you crush your finals. It works by reading your course PDFs and generating structured study notes, which it then uses to quiz you using a technique called "spaced repetition." Best of all, once you've set it up and generated your notes, Ater works fully offline, so you can study anywhere without distractions.

## System Requirements

Before we begin, please make sure your computer meets these requirements:

- **macOS:** Apple Silicon only (M1, M2, M3, or M4 chips). Intel-based Macs are **not** supported.
- **Windows:** Windows 10 or 11 (64-bit only).
- **Linux:** x64 systems, using the AppImage or .deb installer.
- **Disk Space:** At least 500MB of free space (this is because the AI models are bundled directly into the app).
- **RAM:** 8GB minimum recommended for a smooth experience.
- **Internet:** You will need an active internet connection for your **first login** and for **generating new notes**. All other study and review features work completely offline.

---

## Step 1 — Get Access (Waitlist)

Ater is currently invite-only to ensure everyone gets the best experience. To get started:

1. Visit the [Ater Landing Page].
2. Sign up with your email address.
3. Wait for an approval email from Dagim.
4. Once you receive your approval, you can proceed to download and activate the app.

## Step 2 — Download the App

Once you are approved, head over to the official releases page:
[https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest](https://github.com/DagimAlemayehuu/Ater_Releases/releases/latest)

Download the file that matches your operating system:
- **macOS:** `Ater_aarch64.dmg`
- **Windows:** `Ater_setup.exe`
- **Linux:** `Ater_*.AppImage` (preferred) or `.deb`

## Step 3 — Install

### macOS
1. Open the downloaded `.dmg` file.
2. Drag the **Ater** icon into your **Applications** folder.
3. **Important — Gatekeeper Bypass:** Because Ater is a specialized tool and not yet signed with an official Apple Developer certificate, macOS will initially block it. To fix this:
   - Go to your Applications folder.
   - **Right-click** (or Control+click) the Ater app.
   - Select **Open** from the menu.
   - A dialog will appear saying the app is from an unidentified developer. Click **Open** anyway.
   - You only need to do this once!
   - *If that doesn't work:* Go to **System Settings** → **Privacy & Security** → scroll down and click **Open Anyway** next to the Ater icon.

### Windows
1. Run the `Ater_setup.exe` file.
2. If Windows SmartScreen warns you that the app is "unrecognized," click **More info** and then click **Run anyway**.
3. Follow the simple steps in the installer wizard to finish.

### Linux (AppImage)
1. Right-click the `.AppImage` file, go to Properties, and make it executable (or run `chmod +x Ater_*.AppImage` in the terminal).
2. Double-click the file to launch Ater.

## Step 4 — First Launch & Activation

1. Open the Ater app.
2. Log in using the same **email address** you used to sign up for the waitlist.
3. Upon your first login, Ater will "bind" to your computer. This is a security measure to ensure your account is safely linked to your specific device.
4. Once activated, you'll be taken straight to your dashboard.

## Step 5 — Set Up Your Vault

A "Vault" is just a folder on your computer where Ater keeps all your study materials and notes.
1. On your first launch, Ater will ask you where you'd like to save your vault.
2. Choose a location you're comfortable with (for example, your `Documents` folder) and create a folder named `AterVault`.
3. Ater will automatically fill this folder with organized notes that you can even open in other apps like Obsidian if you wish.

## Step 6 — Generate Your First Notes (Ater Architect)

Ready to study? Let's get some material in there!
1. Click the **Ater Architect** tab in the sidebar.
2. Upload a PDF of your lecture notes or paste text directly from your course material.
3. Select which **Course** and **Chapter** these notes belong to.
4. Click **Generate**. The AI will take about 1 to 3 minutes to process everything.
5. Your new, structured notes will appear in your vault automatically!

## Step 7 — Study & Review (Active Recall Engine)

This is where the magic happens.
1. Click **Practice** in the sidebar.
2. Choose the course or chapter you want to review.
3. Ater will ask you questions based on your notes. As you answer, the app tracks how well you remember each concept.
4. **Cognitive Lock:** If your score for a specific topic drops below 70%, Ater will activate a "Feynman Challenge." This means you'll be asked to explain the concept in your own words before you can move on. This is a deliberate feature designed to ensure you actually understand the material, not just memorize it!

---

## Automatic Updates

Ater is constantly improving. The app will automatically check for updates. If a new version is ready, you'll see a notification in the **Settings** tab. Simply click **Update Now** to keep your app up to date with the latest features.

## Troubleshooting

- **App won't open on macOS:** Please see the "Gatekeeper Bypass" instructions in **Step 3** above.
- **"Engine Failure" error:** This usually means the background "engine" (the Python sidecar) failed to start. Try closing Ater completely and reopening it. If that doesn't work, try restarting your computer.
- **Can't log in / "Not Approved":** This means your email hasn't been whitelisted yet. Reach out to Dagim to check your approval status.
- **"Machine already registered" or "DRM Lock" error:** Your account is currently tied to a different computer. If you've changed computers or reinstalled your OS, contact Dagim to reset your device link.
- **Notes not generating:** Ensure you have a working internet connection. Note generation requires the AI to communicate with the cloud (Gemini API).
