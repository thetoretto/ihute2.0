# ihute API server

Local API server for the ihute mobile app. Provides full data (trips, bookings, users, hotpoints, vehicles, ratings, conversations, payment methods, etc.) for testing the app against real HTTP endpoints.

## Run the server

```bash
cd server
npm install
npm run dev
```

The server listens on `http://0.0.0.0:3000` (or `PORT` env). Use `http://localhost:3000` from the emulator or `http://<your-PC-IP>:3000` from a physical device.

## Use the app with the API

1. Start this server (`npm run dev` in `server/`).
2. In the mobile app, set environment variables (e.g. in `mobile/.env` or your shell):
   - `EXPO_PUBLIC_USE_REAL_API=true`
   - `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000` (emulator) or `http://10.0.2.2:3000` (Android emulator) or `http://<your-PC-IP>:3000` (device)
3. Run the app: `cd mobile && npx expo start`.

With `EXPO_PUBLIC_USE_REAL_API=false` (default), the app uses in-memory mocks and does not need the server.

## "Cannot reach server" on device / simulator

1. **Restart Expo** after changing `mobile/.env` (stop `npm start`, then run it again).
2. **No spaces** in the env name: `EXPO_PUBLIC_API_BASE_URL` (not `EXPO_PUBLIC _API_BASE _URL`).
3. **Windows Firewall** may block port 3000. In PowerShell **as Administrator** run once:
   ```powershell
   New-NetFirewallRule -DisplayName "Node 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
4. **Test from your phone**: On the same Wi‑Fi, open in the browser: `http://YOUR_PC_IP:3000/api/hotpoints` (replace with your IPv4 from `ipconfig`). If you see JSON, the server is reachable; then restart Expo and try the app again.
