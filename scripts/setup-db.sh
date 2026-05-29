#!/bin/bash
# Run this once to create the MySQL database and user.
# Usage: bash scripts/setup-db.sh
# You will be prompted for the MySQL root password.

set -e

DB_NAME="pod_db"
DB_USER="pod_user"
DB_PASS=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 20)

echo "Creating database: $DB_NAME"
echo "Creating user: $DB_USER"
echo "Generated password: $DB_PASS"
echo ""
echo "SAVE THIS PASSWORD — you'll need it in your .env file"
echo "DATABASE_URL=\"mysql://$DB_USER:$DB_PASS@127.0.0.1:3306/$DB_NAME\""
echo ""

mysql -u root -p <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "Database setup complete."
echo "Now copy the DATABASE_URL above into your .env file, then run:"
echo "  npx prisma migrate deploy"
