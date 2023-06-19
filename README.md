# Timesheets
This is a tool used to supervise students doing group projets.

# Setup

1. Copy empty.db to timesheets.db
2. In server/config.js, change the emails key: set it to a list of acceptable email domains for your users. Each email domain is prefixed with an @.
3. In server/config.js, change the secret: it is used by the JWT authentication token.
4. In server/config.js, change the other keys as needed.
5. Create www/favicon.ico and www/logo.png with your logo.
6. Run "node createAdmin.js email password" replacing email and password with the superadmin email and password.
7. Run "node server/server.js" to run the server
8. 
