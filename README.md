# Timesheets
This is a tool used to supervise students doing group projets.

# Setup

1. Run "npm i" to install dependencies.
2. Copy empty.db to timesheets.db
3. In server/config.js, change "emails": set it to a list of acceptable email domains for your users. Each email domain is prefixed by an @.
4. In server/config.js, change "secret": it is used by the JWT authentication token and should be unique and known only by your server.
5. In server/config.js, change the other keys as needed.
6. Create www/favicon.ico and www/logo.png with your own logo.
7. Run "node createAdmin.js email password" replacing email and password with the superadmin email and password.
8. Run "node server/server.js" to run the server
