--SQL file Postgres automatically runs the first time its container starts.
--init.sql just creates the empty databases; each service creates its own tables inside its own database when it starts.

CREATE DATABASE auth_db;
CREATE DATABASE chat_db;
CREATE DATABASE game_db;
CREATE DATABASE profile_db;