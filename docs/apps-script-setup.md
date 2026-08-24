# Google Apps Script Setup Guide

To set up direct lead capture from the frontend to your Google Sheet:

1. **Open the Sheet & Script Editor**:
   * Open the destination Google Sheet where onboarding submissions should land.
   * In the top menu, go to **Extensions** -> **Apps Script**.

2. **Paste the Script**:
   * Delete any default code in the editor (`myFunction`).
   * Copy the contents of [`apps-script.gs`](file:///Users/adarshsonu/Desktop/Personal%20Projects/LocalProRealty/onboarding/docs/apps-script.gs) and paste it into the editor.
   * Save the project (click the floppy disk icon or press `Cmd+S` / `Ctrl+S`).

3. **Configure the Shared Secret**:
   * In the Apps Script sidebar (left), click the gear icon (**Project Settings**).
   * Scroll down to the **Script Properties** section.
   * Click **Add script property**.
   * Set the property name to `SHARED_SECRET`.
   * Set the value to a strong, random string (e.g. generated via `openssl rand -hex 16`). *Note down this secret; you will need to add it to your frontend `.env`.*
   * Click **Save script properties**.

4. **Deploy as a Web App**:
   * In the top right, click **Deploy** -> **New deployment**.
   * Click the gear icon next to "Select type" and choose **Web app**.
   * Enter a description (e.g., "LocalPRO Onboarding Submissions Web App").
   * Under **Execute as**, select **Me (your-email@domain.com)**.
   * Under **Who has access**, select **Anyone**. *(This is required so the frontend can submit to it without authentication).*
   * Click **Deploy**.
   * Copy the **Web app URL** (it ends with `/exec`). This will be your `VITE_SHEET_WEBHOOK_URL`.
