ALTER TABLE users
ADD CONSTRAINT users_salesforce_code_unique
UNIQUE (salesforce_code);