-- Audi with you: tickets per booking (events admit 1 person per member of the user's account).
-- Limited seats are counted as SUM(tickets). Delivery (QR or shipping) comes from program.it.json.
ALTER TABLE bookings ADD COLUMN tickets INTEGER NOT NULL DEFAULT 1 CHECK (tickets >= 1);
