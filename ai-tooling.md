# AI tooling

Cursor was used to read the project presentation and the software requirements specification, write `documentation/devplan/development-plan.md`, and generate this React and Flask application from that plan.

What worked: keeping the menu, hours, awards, and reviews as written in the requirements, and generating the five pages, the Flask routes, and the `cafefausse` tables in one pass from the plan.

What did not: the requirements never name a slot length or a guest-count maximum. Those were written down as assumptions in the plan (30-minute seats, 1 to 8 guests) instead of being invented quietly inside the code. The generated reservation transaction still had to be checked against a live Neon database for a full time slot, a bad email, and two bookings that must not receive the same table.
