-- Demo login (9876543210) = doctor app (/dashboard), not Admin Panel
UPDATE users SET role = 'doctor' WHERE mobile = '9876543210' AND role IN ('admin');
