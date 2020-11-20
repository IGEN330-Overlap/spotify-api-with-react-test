Overlap main project repo

### For contributors:
Setup:
1. I recommend having two terminal instances open: one for the frontend directory and one for the backend directory.
2. Run `npm install` for both directories.
3. Create a `.env` file in the backend directory root folder and copy the following:
```
BACKEND_URL=http://localhost:8888
FRONTEND_URL=http://localhost:3000
CLIENT_ID=
CLIENT_SECRET=
```
Contact repo owner for client_id and client_secret, or get your own using the spotify api dashboard.

4. Run `npm start` in the frontend directory.
5. Run `node app.js` in the backend directory.
